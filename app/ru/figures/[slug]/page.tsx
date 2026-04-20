import { supabaseAdmin } from "@/lib/supabase"
import { notFound, permanentRedirect } from "next/navigation"
import FigureDetailContent from "@/components/FigureDetailContent"
import { ru } from "@/lib/dict"
import { getRates, convertPrice } from "@/lib/currency"
import { Metadata } from "next"
import { isUuid, lookupIdBySlug, lookupSlugById } from "@/lib/slug"

export const dynamicParams = true
export const revalidate = 60

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return []
}

interface Props { params: { slug: string } }

async function resolveFigureId(param: string): Promise<string | null> {
  if (isUuid(param)) return param
  return lookupIdBySlug(param)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const figureId = await resolveFigureId(params.slug)
    if (!figureId) return { title: "Figure Not Found" }

    if (isUuid(params.slug)) {
      const slug = await lookupSlugById(figureId)
      if (slug) permanentRedirect(`/ru/figures/${slug}`)
    }

    const { data: figure, error } = await supabaseAdmin
      .from("figures")
      .select("name, character, series, manufacturer, scale, description")
      .eq("id", figureId)
      .maybeSingle()
    if (error || !figure) return { title: "Figure Not Found" }

    const fallback = `${figure.character} · ${figure.series} · ${figure.manufacturer} ${figure.scale}`
    const slugForUrl = isUuid(params.slug) ? (await lookupSlugById(figureId)) || figureId : params.slug
    const canonical = `https://batsclub.com/ru/figures/${slugForUrl}`
    return {
      title: `${figure.name} — ${figure.series} | Bats Club`,
      description: (figure.description as string | null)?.trim() || fallback,
      alternates: {
        canonical,
        languages: {
          en: `https://batsclub.com/figures/${slugForUrl}`,
          ru: canonical,
          ja: `https://batsclub.com/jp/figures/${slugForUrl}`,
          "x-default": `https://batsclub.com/figures/${slugForUrl}`,
        },
      },
    }
  } catch (e: any) {
    if (e?.digest?.startsWith?.("NEXT_")) throw e
    console.error("[ru/figures/[slug]] generateMetadata error:", e)
    return { title: "Figure Not Found" }
  }
}

export default async function FigureDetailPageRu({ params }: Props) {
  const figureId = await resolveFigureId(params.slug)
  if (!figureId) notFound()

  if (isUuid(params.slug)) {
    const slug = await lookupSlugById(figureId)
    if (slug) permanentRedirect(`/ru/figures/${slug}`)
  }

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
      .eq("id", figureId)
      .eq("listings.active", true)
      .order("price", { ascending: true, referencedTable: "listings" })
      .maybeSingle()
    if (error) {
      console.error("[ru/figures/[slug]] main query error:", error)
      notFound()
    }
    figure = data
  } catch (e: any) {
    if (e?.digest?.startsWith?.("NEXT_")) throw e
    console.error("[ru/figures/[slug]] main query threw:", e)
    notFound()
  }

  if (!figure) notFound()

  let localeDesc: { description_ru?: string | null } | null = null
  try {
    const { data } = await supabaseAdmin
      .from("figures")
      .select("description_ru")
      .eq("id", figureId)
      .maybeSingle()
    localeDesc = data
  } catch {
    // column may not exist yet
  }

  const slugForUrl = (await lookupSlugById(figureId)) || figureId

  const userFigures = figure.user_figures || []
  const listings = (figure.listings || []) as any[]
  const articleFigures = figure.article_figures || []

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
      .neq("id", figureId)
      .limit(4)

    relatedFigures = (seriesFigures || []) as any[]
    if (relatedFigures.length < 4) {
      const needed = 4 - relatedFigures.length
      const existingIds = [figureId, ...relatedFigures.map((f: any) => f.id)]
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
    console.error("[ru/figures/[slug]] related figures query failed:", e)
    relatedFigures = []
  }

  let convertedLowestPrice: string | null = null
  try {
    const rates = await getRates()
    convertedLowestPrice = lowestPrice !== null ? convertPrice(lowestPrice, "ru", rates) : null
  } catch (e) {
    console.error("[ru/figures/[slug]] currency conversion failed:", e)
  }

  const offer: any = {
    "@type": "Offer",
    url: `https://batsclub.com/ru/figures/${slugForUrl}`,
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
      figure={{ ...(figure as any), descriptionLocale: (localeDesc as any)?.description_ru || null, userFigures, articleFigures } as any}
      publishedArticles={publishedArticles}
      relatedFigures={relatedFigures}
      userStatus={userStatus}
      wishlistCount={wishlistCount}
      haveCount={haveCount}
      lowestPrice={lowestPrice}
      convertedLowestPrice={convertedLowestPrice}
      cheapestListing={cheapestListing}
      jsonLd={jsonLd}
      dict={ru}
      archiveHref="/ru/archive"
    />
  )
}
