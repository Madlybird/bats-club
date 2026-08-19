import { Suspense } from "react"
import type { Metadata } from "next"
import { supabaseAdmin } from "@/lib/supabase"
import ShopPageContent from "@/components/ShopPageContent"
import { en } from "@/lib/dict"
import { parsePriceRange } from "@/lib/price-range"
import { buildCollectionPageJsonLd } from "@/lib/collection-jsonld"
import { getShopCollections, getCollectionFigureIds } from "@/lib/collections"

export const metadata: Metadata = {
  title: "Buy Rare Anime Figures",
  description:
    "Shop authentic vintage anime figures from a private Japanese collection. Worldwide shipping. All figures verified and described.",
  alternates: {
    canonical: "https://batsclub.com/shop",
    languages: {
      en: "https://batsclub.com/shop",
      ru: "https://batsclub.com/ru/shop",
      ja: "https://batsclub.com/jp/shop",
      "x-default": "https://batsclub.com/shop",
    },
  },
}

// Listing counts must always be accurate (no ISR window) — this route
// already reads searchParams so it renders dynamically anyway.
export const dynamic = "force-dynamic"
// dynamic="force-dynamic" alone only stops the *page* from being cached.
// The unfiltered listings query (no .gte/.lte chained on) has a fixed
// request shape and was getting served from a stale Next Data Cache
// entry — active new listings didn't show up until a price filter was
// applied, which produces a different request shape and always missed
// the cache. This forces every fetch in the route to bypass it.
export const fetchCache = "force-no-store"

function ShopSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-2xl border border-white/[0.06] animate-pulse"
            style={{ background: "rgba(255,255,255,0.02)" }}
          />
        ))}
      </div>
    </div>
  )
}

interface Props { searchParams: Promise<{ price?: string; sort?: string; series?: string; collection?: string }> }

async function getTopSeries() {
  // Badge must show how many listings are actually for sale in that
  // series, not the page-view count series_views tracks — those are
  // two different numbers and showing "views" as a listing count was
  // misleading.
  const [{ data: listings }, { data: viewsData }] = await Promise.all([
    supabaseAdmin.from("listings").select("figure:figures(series)").eq("active", true),
    supabaseAdmin.from("series_views").select("series, views"),
  ])

  const counts: Record<string, number> = {}
  ;(listings || []).forEach((l: any) => {
    const s = (Array.isArray(l.figure) ? l.figure[0] : l.figure)?.series
    if (s) counts[s] = (counts[s] || 0) + 1
  })

  const viewsMap: Record<string, number> = {}
  ;(viewsData || []).forEach((r: any) => { viewsMap[r.series] = r.views })

  // Order by popularity (views) when we have it, real listing count otherwise.
  return Object.entries(counts)
    .map(([series, count]) => ({ series, count, views: viewsMap[series] ?? 0 }))
    .sort((a, b) => b.views - a.views || b.count - a.count)
    .slice(0, 5)
}

export default async function ShopPage(props: Props) {
  const searchParams = await props.searchParams;
  const { price, sort, series, collection } = searchParams

  // !inner promotes the figure embed from "left join" (nulls out
  // non-matching rows) to "inner join" (drops them entirely), so the
  // series filter actually narrows the result set in Postgres instead
  // of in JS afterwards.
  const figureEmbed = series
    ? "figure:figures!inner(id, name, series, character, scale, imageUrl:image_url, isMature:is_mature)"
    : "figure:figures(id, name, series, character, scale, imageUrl:image_url, isMature:is_mature)"

  let query = supabaseAdmin
    .from("listings")
    .select(`
      id, price, condition, stock, photos, description, active,
      figureId:figure_id, sellerId:seller_id, createdAt:created_at,
      ${figureEmbed},
      seller:users(id, name, username)
    `)
    .eq("active", true)

  const priceRange = parsePriceRange(price)
  if (priceRange) {
    query = query.gte("price", priceRange.min)
    if (priceRange.max !== undefined) query = query.lte("price", priceRange.max)
  }
  if (series) query = query.eq("figures.series", series)
  if (collection) {
    const figureIds = await getCollectionFigureIds(collection)
    // Empty (not null) figureIds means the collection is real but has no
    // members — force a no-results query rather than falling through to
    // an unfiltered one.
    query = query.in("figure_id", figureIds ?? [])
  }
  if (sort === "price_asc") query = query.order("price", { ascending: true })
  else if (sort === "price_desc") query = query.order("price", { ascending: false })
  else query = query.order("created_at", { ascending: false })

  const [{ data: listings }, topSeries, topCollections] = await Promise.all([
    query,
    getTopSeries(),
    getShopCollections("en"),
  ])

  const filtered = (listings || []) as any[]
  const collectionJsonLd = buildCollectionPageJsonLd({
    name: "Bats Club Shop",
    description: "Shop authentic vintage anime figures from a private Japanese collection.",
    url: "https://batsclub.com/shop",
    numberOfItems: filtered.length,
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd).replace(/</g, "\\u003c") }}
      />
      <Suspense fallback={<ShopSkeleton />}>
        <ShopPageContent
          listings={filtered as any}
          priceRange={price}
          sort={sort}
          series={series}
          topSeries={topSeries}
          collection={collection}
          topCollections={topCollections}
          dict={en}
          shopBasePath="/shop"
        />
      </Suspense>
    </>
  )
}
