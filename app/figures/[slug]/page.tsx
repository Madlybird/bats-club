import { supabaseAdmin } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { cache } from "react"
import FigureDetailContent from "@/components/FigureDetailContent"
import { en } from "@/lib/dict"
import { Metadata } from "next"
import { isUuid, lookupIdBySlug } from "@/lib/slug"

export const dynamicParams = true
export const revalidate = 86400

// Pre-generate the 100 most recently added figures at build time so
// archive clicks (which emit UUID URLs) hit an ISR cache entry instead
// of a cold miss. Any figure not in this set still renders via
// dynamicParams — just with the cold-miss penalty on first hit.
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

// React cache() dedupes these calls across generateMetadata + the page
// render within a single request. Without it, both ran their own DB
// round-trips for the same figure — doubling cold-miss latency.
const resolveFigureId = cache(async (param: string): Promise<string | null> => {
  if (isUuid(param)) return param
  return lookupIdBySlug(param)
})

const getFigureCore = cache(async (figureId: string) => {
  const { data, error } = await supabaseAdmin
    .from("figures")
    .select(
      "id, slug, name, series, character, manufacturer, scale, year, sculptor, material, imageUrl:image_url, images, description, createdAt:created_at"
    )
    .eq("id", figureId)
    .maybeSingle()
  if (error) throw error
  return data as (Record<string, any> & { slug: string | null }) | null
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const figureId = await resolveFigureId(params.slug)
    if (!figureId) return { title: "Figure Not Found" }

    const figure = await getFigureCore(figureId)
    if (!figure) return { title: "Figure Not Found" }

    const fallback = `${figure.character} from ${figure.series} — ${figure.manufacturer} ${figure.scale}`
    const slugForUrl = figure.slug || figureId
    const canonical = `https://batsclub.com/figures/${slugForUrl}`
    return {
      title: `${figure.name} — ${figure.series} | Bats Club`,
      description: (figure.description as string | null)?.trim() || fallback,
      alternates: {
        canonical,
        languages: {
          en: canonical,
          ru: `https://batsclub.com/ru/figures/${slugForUrl}`,
          ja: `https://batsclub.com/jp/figures/${slugForUrl}`,
          "x-default": canonical,
        },
      },
    }
  } catch (e: any) {
    if (e?.digest?.startsWith?.("NEXT_")) throw e
    console.error("[figures/[slug]] generateMetadata error:", e)
    return { title: "Figure Not Found" }
  }
}

export default async function FigureDetailPage({ params }: Props) {
  const figureId = await resolveFigureId(params.slug)
  if (!figureId) notFound()

  // No UUID → slug redirect. The archive emits UUID URLs; redirecting
  // used to fire an extra DB lookup + 308 round-trip + second render,
  // stacking 1-2s onto every click. Canonical URL in metadata keeps
  // the slug URL authoritative for SEO.

  let figure: Record<string, any> | null = null
  try {
    figure = await getFigureCore(figureId)
  } catch (e: any) {
    if (e?.digest?.startsWith?.("NEXT_")) throw e
    console.error("[figures/[slug]] figure query threw:", e)
    notFound()
  }
  if (!figure) notFound()

  // Fetch the expensive auxiliary data in parallel with each other.
  // None depend on anything except figureId, which we already have.
  const [listingsRes, userFiguresRes, articleFiguresRes] = await Promise.all([
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

  // Related figures: two small queries, parallelized. The second
  // (by manufacturer) is only used to backfill to 4 entries.
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
    console.error("[figures/[slug]] related figures query failed:", e)
    relatedFigures = []
  }

  const slugForUrl = figure.slug || figureId

  const offer: any = {
    "@type": "Offer",
    url: `https://batsclub.com/figures/${slugForUrl}`,
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
      figure={figure as any}
      publishedArticles={publishedArticles}
      relatedFigures={relatedFigures}
      userStatus={null}
      wishlistCount={wishlistCount}
      haveCount={haveCount}
      lowestPrice={lowestPrice}
      convertedLowestPrice={null}
      cheapestListing={cheapestListing}
      jsonLd={jsonLd}
      dict={en}
      archiveHref="/archive"
    />
  )
}
