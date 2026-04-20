import { supabaseAdmin } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { cache } from "react"
import FigureDetailContent from "@/components/FigureDetailContent"
import { jp } from "@/lib/dict"
import { getRates, convertPrice } from "@/lib/currency"
import { Metadata } from "next"
import { isUuid, lookupIdBySlug } from "@/lib/slug"

export const dynamicParams = true
export const revalidate = 300

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

interface Props { params: { slug: string } }

const resolveFigureId = cache(async (param: string): Promise<string | null> => {
  if (isUuid(param)) return param
  return lookupIdBySlug(param)
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
        "id, slug, name, series, character, manufacturer, scale, year, sculptor, material, imageUrl:image_url, images, description, createdAt:created_at"
      )
      .eq("id", figureId)
      .maybeSingle()
    if (err2) throw err2
    return data2 as (Record<string, any> & { slug: string | null }) | null
  }
  return data as (Record<string, any> & { slug: string | null; description_jp?: string | null }) | null
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const figureId = await resolveFigureId(params.slug)
    if (!figureId) return { title: "Figure Not Found" }

    const figure = await getFigureCore(figureId)
    if (!figure) return { title: "Figure Not Found" }

    const fallback = `${figure.character} · ${figure.series} · ${figure.manufacturer} ${figure.scale}`
    const slugForUrl = figure.slug || figureId
    const canonical = `https://batsclub.com/jp/figures/${slugForUrl}`
    return {
      title: `${figure.name} — ${figure.series} | Bats Club`,
      description: (figure.description as string | null)?.trim() || fallback,
      alternates: {
        canonical,
        languages: {
          en: `https://batsclub.com/figures/${slugForUrl}`,
          ru: `https://batsclub.com/ru/figures/${slugForUrl}`,
          ja: canonical,
          "x-default": `https://batsclub.com/figures/${slugForUrl}`,
        },
      },
    }
  } catch (e: any) {
    if (e?.digest?.startsWith?.("NEXT_")) throw e
    console.error("[jp/figures/[slug]] generateMetadata error:", e)
    return { title: "Figure Not Found" }
  }
}

export default async function FigureDetailPageJp({ params }: Props) {
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
      .select(`article:articles(id, title, slug, excerpt, published, author:users(id, name, username, avatar))`)
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

  let relatedFigures: any[] = []
  try {
    const [seriesRes, mfgRes] = await Promise.all([
      supabaseAdmin
        .from("figures")
        .select("id, slug, name, series, imageUrl:image_url, images")
        .eq("series", figure.series)
        .neq("id", figureId)
        .limit(4),
      supabaseAdmin
        .from("figures")
        .select("id, slug, name, series, imageUrl:image_url, images")
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

  const offer: any = {
    "@type": "Offer",
    url: `https://batsclub.com/jp/figures/${slugForUrl}`,
    priceCurrency: "USD",
    availability: cheapestListing ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    itemCondition: "https://schema.org/UsedCondition",
    seller: { "@type": "Organization", name: "Bats Club" },
  }
  if (cheapestListing) {
    offer.price = Number((cheapestListing.price / 100).toFixed(2))
    offer.hasMerchantReturnPolicy = {
      "@type": "MerchantReturnPolicy",
      applicableCountry: "US",
      returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
    }
    offer.shippingDetails = {
      "@type": "OfferShippingDetails",
      shippingRate: { "@type": "MonetaryAmount", value: "17", currency: "USD" },
      shippingDestination: { "@type": "DefinedRegion", addressCountry: "US" },
      deliveryTime: {
        "@type": "ShippingDeliveryTime",
        businessDays: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        },
        cutoffTime: "17:00:00",
        handlingTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 3, unitCode: "DAY" },
        transitTime: { "@type": "QuantitativeValue", minValue: 14, maxValue: 21, unitCode: "DAY" },
      },
    }
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: figure.name,
    sku: figure.id,
    productID: figure.id,
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
    />
  )
}
