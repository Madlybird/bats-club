import { supabaseAdmin } from "@/lib/supabase"
import { notFound } from "next/navigation"
import FigureDetailContent from "@/components/FigureDetailContent"
import { jp } from "@/lib/dict"
import { getRates, convertPrice } from "@/lib/currency"
import { Metadata } from "next"

export const dynamicParams = true
export const revalidate = 60

export async function generateStaticParams(): Promise<{ id: string }[]> {
  return []
}

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { data: figure, error } = await supabaseAdmin
      .from("figures")
      .select("name, character, series, manufacturer, scale, description")
      .eq("id", params.id)
      .maybeSingle()
    if (error || !figure) return { title: "Figure Not Found" }
    const fallback = `${figure.character} · ${figure.series} · ${figure.manufacturer} ${figure.scale}`
    return {
      title: `${figure.name} — ${figure.series} | Bats Club`,
      description: (figure.description as string | null)?.trim() || fallback,
    }
  } catch (e) {
    console.error("[jp/figures/[id]] generateMetadata error:", e)
    return { title: "Figure Not Found" }
  }
}

export default async function FigureDetailPageJp({ params }: Props) {
  // No getServerSession here on purpose: this page is ISR-cached
  // (revalidate=60), so it must not depend on per-user request state.
  // The current user's HAVE/WISHLIST/BUY status is fetched client-side
  // by <StatusButton/> via /api/user-figures.

  let figure: any = null
  try {
    const { data, error } = await supabaseAdmin
      .from("figures")
      .select(`
        id, name, series, character, manufacturer, scale, year, sculptor, material,
        imageUrl:image_url, images, description, createdAt:created_at,
        user_figures(userId:user_id, status),
        listings(
          id, price, condition, stock, photos, description, active, createdAt:created_at,
          seller:users(id, name, username, avatar),
          figure:figures(id, name, series, scale, imageUrl:image_url)
        ),
        article_figures(
          article:articles(id, title, slug, excerpt, published, author:users(id, name, username, avatar))
        )
      `)
      .eq("id", params.id)
      .eq("listings.active", true)
      .order("price", { ascending: true, referencedTable: "listings" })
      .maybeSingle()
    if (error) {
      console.error("[jp/figures/[id]] main query error:", error)
      notFound()
    }
    figure = data
  } catch (e: any) {
    if (e?.digest?.startsWith?.("NEXT_")) throw e
    console.error("[jp/figures/[id]] main query threw:", e)
    notFound()
  }

  if (!figure) notFound()

  // Fetch locale description separately — graceful if column doesn't exist yet
  let localeDesc: { description_jp?: string | null } | null = null
  try {
    const { data } = await supabaseAdmin
      .from("figures")
      .select("description_jp")
      .eq("id", params.id)
      .maybeSingle()
    localeDesc = data
  } catch {
    // column may not exist yet — fall back to null
  }

  const userFigures = figure.user_figures || []
  const listings = (figure.listings || []) as any[]
  const articleFigures = figure.article_figures || []

  // userStatus is hydrated client-side by StatusButton; the static page
  // ships with null so the same HTML can be cached for every visitor.
  const userStatus: string | null = null

  const wishlistCount = userFigures.filter((uf: any) => uf.status === "WISHLIST").length
  const haveCount = userFigures.filter((uf: any) => uf.status === "HAVE").length
  const lowestPrice = listings.length > 0 ? Math.min(...listings.map((l: any) => l.price)) : null
  const cheapestListing = listings.length > 0
    ? (() => {
        const c = listings.reduce((a: any, b: any) => (a.price <= b.price ? a : b))
        return { id: c.id, price: c.price, condition: c.condition }
      })()
    : null

  const publishedArticles = articleFigures
    .map((af: any) => af.article)
    .filter((a: any) => a && a.published)

  let relatedFigures: any[] = []
  try {
    const { data: seriesFigures } = await supabaseAdmin
      .from("figures")
      .select("id, name, series, imageUrl:image_url, images")
      .eq("series", figure.series)
      .neq("id", params.id)
      .limit(4)

    relatedFigures = (seriesFigures || []) as any[]
    if (relatedFigures.length < 4) {
      const needed = 4 - relatedFigures.length
      const existingIds = [params.id, ...relatedFigures.map((f: any) => f.id)]
      const { data: mfgFigures } = await supabaseAdmin
        .from("figures")
        .select("id, name, series, imageUrl:image_url, images")
        .eq("manufacturer", figure.manufacturer)
        .neq("series", figure.series)
        .not("id", "in", `(${existingIds.join(",")})`)
        .limit(needed)
      relatedFigures = [...relatedFigures, ...(mfgFigures || [])]
    }
  } catch (e) {
    console.error("[jp/figures/[id]] related figures query failed:", e)
    relatedFigures = []
  }

  let convertedLowestPrice: string | null = null
  try {
    const rates = await getRates()
    convertedLowestPrice = lowestPrice !== null ? convertPrice(lowestPrice, "jp", rates) : null
  } catch (e) {
    console.error("[jp/figures/[id]] currency conversion failed:", e)
  }

  const offer: any = {
    "@type": "Offer",
    url: `https://batsclub.com/figures/${figure.id}`,
    priceCurrency: "USD",
    availability: cheapestListing ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    seller: { "@type": "Organization", name: "Bats Club" },
  }
  if (cheapestListing) offer.price = (cheapestListing.price / 100).toFixed(2)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: figure.name,
    description: (figure.description as string | null)?.trim() || `Character: ${figure.character}, Series: ${figure.series}`,
    image: figure.imageUrl,
    brand: { "@type": "Brand", name: figure.manufacturer },
    offers: offer,
    additionalProperty: [
      { "@type": "PropertyValue", name: "Year", value: figure.year },
      { "@type": "PropertyValue", name: "Scale", value: figure.scale },
      { "@type": "PropertyValue", name: "Condition", value: cheapestListing?.condition },
      { "@type": "PropertyValue", name: "Series", value: figure.series },
    ].filter((p) => p.value),
  }

  return (
    <FigureDetailContent
      figure={{ ...(figure as any), descriptionLocale: (localeDesc as any)?.description_jp || null, userFigures, articleFigures } as any}
      publishedArticles={publishedArticles}
      relatedFigures={relatedFigures}
      userStatus={userStatus}
      wishlistCount={wishlistCount}
      haveCount={haveCount}
      lowestPrice={lowestPrice}
      convertedLowestPrice={convertedLowestPrice}
      cheapestListing={cheapestListing}
      jsonLd={jsonLd}
      dict={jp}
      archiveHref="/jp/archive"
    />
  )
}
