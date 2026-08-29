import { supabaseAdmin } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { cache } from "react"
import FigureDetailContent from "@/components/FigureDetailContent"
import { jp } from "@/lib/dict"
import { getRates, convertPrice } from "@/lib/currency"
import { Metadata } from "next"
import { isUuid, lookupIdBySlug } from "@/lib/slug"
import { isHiddenFigure } from "@/lib/hidden"
import { localizeArticle } from "@/lib/articleI18n"
import { buildListingJsonLd } from "@/lib/listing-jsonld"
import { figurePageMetadata } from "@/lib/product-metadata"

function parseImages(raw: unknown): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.filter((u): u is string => typeof u === "string")
  if (typeof raw === "string") {
    try { const p = JSON.parse(raw); return Array.isArray(p) ? p.filter((u): u is string => typeof u === "string") : [] }
    catch { return [] }
  }
  return []
}

export const dynamicParams = true
export const revalidate = 86400

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("figures")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(100)
    if (error) return []
    return (data || []).map((f: { id: string }) => ({ slug: f.id }))
  } catch {
    return []
  }
}

interface Props { params: Promise<{ slug: string }> }

const resolveFigureId = cache(async (param: string): Promise<string | null> => {
  const id = isUuid(param) ? param : await lookupIdBySlug(param)
  if (isHiddenFigure(id)) return null
  return id
})

const getFigureCore = cache(async (figureId: string) => {
  const { data, error } = await supabaseAdmin
    .from("figures")
    .select(
      "id, slug, name, series, character, manufacturer, scale, year, sculptor, material, imageUrl:image_url, images, description, description_jp, createdAt:created_at"
    )
    .eq("id", figureId)
    .maybeSingle()
  if (error) {
    const { data: data2, error: err2 } = await supabaseAdmin
      .from("figures")
      .select(
        "id, slug, name, series, character, manufacturer, scale, year, sculptor, material, imageUrl:image_url, images, isMature:is_mature, description, createdAt:created_at"
      )
      .eq("id", figureId)
      .maybeSingle()
    if (err2) throw err2
    return data2 as (Record<string, any> & { slug: string | null }) | null
  }
  return data as (Record<string, any> & { slug: string | null; description_jp?: string | null }) | null
})

// See app/figures/[slug]/page.tsx: id of the cheapest active listing, or
// null for archive-only figures. Figures with a live listing canonical to
// their /shop/<id> page.
const getActiveListingId = cache(async (figureId: string): Promise<string | null> => {
  const { data } = await supabaseAdmin
    .from("listings")
    .select("id")
    .eq("figure_id", figureId)
    .eq("active", true)
    .order("price", { ascending: true })
    .limit(1)
    .maybeSingle()
  return (data as { id: string } | null)?.id ?? null
})

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  try {
    const figureId = await resolveFigureId(params.slug)
    if (!figureId) return { title: "Figure Not Found" }

    const figure = await getFigureCore(figureId)
    if (!figure) return { title: "Figure Not Found" }

    const fallback = `${figure.character} · ${figure.series} · ${figure.manufacturer} ${figure.scale}`
    const slugForUrl = figure.slug || figureId
    const title = `${figure.name} — ${figure.series}`
    const image = parseImages(figure.images)[0] || figure.imageUrl || null
    const activeListingId = await getActiveListingId(figureId)
    return {
      title,
      description: (figure.description as string | null)?.trim() || fallback,
      ...figurePageMetadata(slugForUrl, "jp", title, image, activeListingId),
    }
  } catch (e: any) {
    if (e?.digest?.startsWith?.("NEXT_")) throw e
    console.error("[jp/figures/[slug]] generateMetadata error:", e)
    return { title: "Figure Not Found" }
  }
}

export default async function FigureDetailPageJp(props: Props) {
  const params = await props.params;
  const figureId = await resolveFigureId(params.slug)
  if (!figureId) notFound()

  let figure: Record<string, any> | null = null
  try {
    figure = await getFigureCore(figureId)
  } catch (e: any) {
    if (e?.digest?.startsWith?.("NEXT_")) throw e
    console.error("[jp/figures/[slug]] figure query threw:", e)
    notFound()
  }
  if (!figure) notFound()

  const [listingsRes, userFiguresRes, articleFiguresRes, rates] = await Promise.all([
    supabaseAdmin
      .from("listings")
      .select("id, price, condition, stock")
      .eq("figure_id", figureId)
      .eq("active", true)
      .order("price", { ascending: true }),
    supabaseAdmin
      .from("user_figures")
      .select("status")
      .eq("figure_id", figureId),
    supabaseAdmin
      .from("article_figures")
      .select(`article:articles(id, title, slug, excerpt, published, coverImage:cover_image, createdAt:created_at, author:users(id, name, username, avatar))`)
      .eq("figure_id", figureId),
    getRates().catch((e) => {
      console.error("[jp/figures/[slug]] rates failed:", e)
      return null
    }),
  ])

  const listings = (listingsRes.data || []) as Array<{ id: string; price: number; condition: string; stock: number }>
  const userFigures = (userFiguresRes.data || []) as Array<{ status: string }>
  const articleFigures = (articleFiguresRes.data || []) as Array<{ article: any }>

  const wishlistCount = userFigures.filter((uf) => uf.status === "WISHLIST").length
  const haveCount = userFigures.filter((uf) => uf.status === "HAVE").length
  const lowestPrice = listings.length > 0 ? listings[0].price : null
  const cheapestListing = listings.length > 0
    ? { id: listings[0].id, price: listings[0].price, condition: listings[0].condition }
    : null

  const publishedArticles = articleFigures
    .map((af) => af.article)
    .filter((a: any) => a && a.published)
    .map((a: any) => localizeArticle(a, "jp"))

  let relatedFigures: any[] = []
  try {
    const [seriesRes, mfgRes] = await Promise.all([
      supabaseAdmin
        .from("figures")
        .select("id, slug, name, series, imageUrl:image_url, images, isMature:is_mature")
        .eq("series", figure.series)
        .neq("id", figureId)
        .limit(4),
      supabaseAdmin
        .from("figures")
        .select("id, slug, name, series, imageUrl:image_url, images, isMature:is_mature")
        .eq("manufacturer", figure.manufacturer)
        .neq("series", figure.series)
        .neq("id", figureId)
        .limit(4),
    ])
    const seriesFigures = (seriesRes.data || []) as any[]
    relatedFigures = seriesFigures.slice(0, 4)
    if (relatedFigures.length < 4) {
      const have = new Set(relatedFigures.map((f) => f.id))
      for (const f of (mfgRes.data || []) as any[]) {
        if (relatedFigures.length >= 4) break
        if (!have.has(f.id)) { relatedFigures.push(f); have.add(f.id) }
      }
    }
  } catch (e) {
    console.error("[jp/figures/[slug]] related figures query failed:", e)
    relatedFigures = []
  }

  const convertedLowestPrice = rates && lowestPrice !== null ? convertPrice(lowestPrice, "jp", rates) : null

  const slugForUrl = figure.slug || figureId

  // Product+Offer JSON-LD, only when there's a real active listing to
  // price it from — see app/figures/[slug]/page.tsx for why this is no
  // longer unconditionally null (Google's Shopping auto-discovery was
  // indexing this URL with no price, flagging active listings as
  // "missing product price" / Not approved in Merchant Center).
  const figureImages = parseImages(figure.images)
  const displayImages = figureImages.length > 0 ? figureImages : figure.imageUrl ? [figure.imageUrl] : []
  const jsonLd = listings.length > 0
    ? buildListingJsonLd(listings[0], figure as any, displayImages, "jp")
    : null

  return (
    <FigureDetailContent
      figure={{ ...figure, descriptionLocale: (figure as any).description_jp || null } as any}
      publishedArticles={publishedArticles}
      relatedFigures={relatedFigures}
      userStatus={null}
      wishlistCount={wishlistCount}
      haveCount={haveCount}
      lowestPrice={lowestPrice}
      convertedLowestPrice={convertedLowestPrice}
      cheapestListing={cheapestListing}
      jsonLd={jsonLd}
      dict={jp}
      archiveHref="/jp/archive"
      articlesHref="/jp/articles"
    />
  )
}
