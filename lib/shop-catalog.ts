import { unstable_cache } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase"
import { parsePriceRange } from "@/lib/price-range"
import { SHOP_COLLECTION_SLUGS, type ShopCollection } from "@/lib/collections"

// Cached /shop catalog (en/ru/jp). The whole active-listings set is small
// (a few hundred rows), so it's fetched once, cached under the "figures"
// tag and filtered/sorted in memory per request — no DB round-trip per
// visit. Every listing/figure mutation path already calls
// revalidateTag("figures", { expire: 0 }) (API routes, Stripe webhook, and
// the Telegram bot via /api/admin/revalidate), so new/sold/edited listings
// show up on the next request; the 1h revalidate is only a safety net for
// direct DB edits that skip those paths.
//
// History: this route used force-dynamic + fetchCache="force-no-store"
// because an *untagged* implicit fetch cache once served a stale listings
// set with no way to purge it. Tagging is what makes caching safe here.

export interface ShopListing {
  id: string
  price: number
  condition: string
  stock: number
  photos: string[]
  createdAt: string
  figure: {
    id: string
    name: string
    series: string
    character: string
    scale: string
    imageUrl: string | null
    isMature: boolean | null
  }
}

interface ShopCatalog {
  listings: ShopListing[]
  seriesViews: Record<string, number>
  collections: {
    slug: string
    nameEn: string | null
    nameRu: string | null
    nameJp: string | null
    figureIds: string[]
  }[]
}

// Only the first photo is ever rendered on a card; the full array stays on
// the detail page. Keeps the cached payload and RSC props small.
function firstPhoto(raw: unknown): string[] {
  let arr: unknown = raw
  if (typeof raw === "string") {
    try { arr = JSON.parse(raw) } catch { arr = [] }
  }
  return Array.isArray(arr) && typeof arr[0] === "string" ? [arr[0]] : []
}

const getShopCatalog = unstable_cache(
  async (): Promise<ShopCatalog> => {
    const [listingsRes, viewsRes, collectionsRes] = await Promise.all([
      supabaseAdmin
        .from("listings")
        .select(`
          id, price, condition, stock, photos, createdAt:created_at,
          figure:figures(id, name, series, character, scale, imageUrl:image_url, isMature:is_mature)
        `)
        .eq("active", true)
        // Art listings (art_id set, figure_id null) live on /art only.
        .not("figure_id", "is", null)
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("series_views").select("series, views"),
      supabaseAdmin
        .from("collections")
        .select("slug, nameEn:name_en, nameRu:name_ru, nameJp:name_jp, position, collection_figures(figure_id)")
        .eq("active", true)
        .in("slug", SHOP_COLLECTION_SLUGS)
        .order("position", { ascending: true }),
    ])

    // Throwing (instead of caching an empty catalog) keeps a transient DB
    // error from being cached as "shop is empty" for an hour.
    if (listingsRes.error) throw new Error(`[shop-catalog] listings: ${listingsRes.error.message}`)

    const listings: ShopListing[] = (listingsRes.data || [])
      .map((l: any) => ({
        ...l,
        photos: firstPhoto(l.photos),
        figure: Array.isArray(l.figure) ? l.figure[0] : l.figure,
      }))
      .filter((l: ShopListing) => !!l.figure)

    const seriesViews: Record<string, number> = {}
    ;(viewsRes.data || []).forEach((r: any) => { seriesViews[r.series] = r.views })

    const collections = (collectionsRes.data || []).map((c: any) => ({
      slug: c.slug,
      nameEn: c.nameEn,
      nameRu: c.nameRu,
      nameJp: c.nameJp,
      figureIds: (c.collection_figures || []).map((cf: any) => cf.figure_id),
    }))

    return { listings, seriesViews, collections }
  },
  ["shop-catalog-v1"],
  { tags: ["figures"], revalidate: 3600 },
)

export interface ShopFilters {
  price?: string
  sort?: string
  series?: string
  collection?: string
}

export async function getShopPageData(
  locale: "en" | "ru" | "jp",
  { price, sort, series, collection }: ShopFilters,
) {
  const { listings: all, seriesViews, collections } = await getShopCatalog()

  // Popular series pills: real active-listing count per series, ordered by
  // page views when known (same rule as before).
  const counts: Record<string, number> = {}
  for (const l of all) counts[l.figure.series] = (counts[l.figure.series] || 0) + 1
  const topSeries = Object.entries(counts)
    .map(([s, count]) => ({ series: s, count, views: seriesViews[s] ?? 0 }))
    .sort((a, b) => b.views - a.views || b.count - a.count)
    .slice(0, 5)

  // Collection pills only count figures that currently have an active
  // listing; empty ones are hidden rather than dead-ending visitors.
  const activeFigureIds = new Set(all.map((l) => l.figure.id))
  const topCollections: ShopCollection[] = collections
    .map((c) => ({
      slug: c.slug,
      name: (locale === "ru" ? c.nameRu : locale === "jp" ? c.nameJp : c.nameEn) || c.nameEn || c.slug,
      count: c.figureIds.filter((id) => activeFigureIds.has(id)).length,
    }))
    .filter((c) => c.count > 0)

  let listings = all
  const priceRange = parsePriceRange(price)
  if (priceRange) {
    listings = listings.filter(
      (l) => l.price >= priceRange.min && (priceRange.max === undefined || l.price <= priceRange.max),
    )
  }
  if (series) listings = listings.filter((l) => l.figure.series === series)
  if (collection) {
    // Unknown collection → no results (never fall through to unfiltered).
    const ids = new Set(collections.find((c) => c.slug === collection)?.figureIds ?? [])
    listings = listings.filter((l) => ids.has(l.figure.id))
  }
  if (sort === "price_asc") listings = [...listings].sort((a, b) => a.price - b.price)
  else if (sort === "price_desc") listings = [...listings].sort((a, b) => b.price - a.price)
  // default: newest first, already the catalog order

  return { listings, topSeries, topCollections }
}
