import { Suspense } from "react"
import type { Metadata } from "next"
import { supabaseAdmin } from "@/lib/supabase"
import ShopPageContent from "@/components/ShopPageContent"
import { en } from "@/lib/dict"
import { parsePriceRange } from "@/lib/price-range"

export const metadata: Metadata = {
  title: "Buy Rare Anime Figures | Bats Club",
  description:
    "Shop authentic vintage anime figures from a private Japanese collection. Worldwide shipping. All figures verified and described.",
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

interface Props { searchParams: { price?: string; sort?: string; series?: string } }

async function getTopSeries() {
  const { data } = await supabaseAdmin
    .from("series_views")
    .select("series, views")
    .order("views", { ascending: false })
    .limit(5)
  if (!data || data.length === 0) {
    // Fallback: top series by listing count
    const { data: listings } = await supabaseAdmin
      .from("listings")
      .select("figure:figures(series)")
      .eq("active", true)
    const counts: Record<string, number> = {}
    ;(listings || []).forEach((l: any) => {
      const s = (Array.isArray(l.figure) ? l.figure[0] : l.figure)?.series
      if (s) counts[s] = (counts[s] || 0) + 1
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([series, count]) => ({ series, count }))
  }
  return data.map((r: any) => ({ series: r.series, views: r.views, count: r.views }))
}

export default async function ShopPage({ searchParams }: Props) {
  const { price, sort, series } = searchParams

  // !inner promotes the figure embed from "left join" (nulls out
  // non-matching rows) to "inner join" (drops them entirely), so the
  // series filter actually narrows the result set in Postgres instead
  // of in JS afterwards.
  const figureEmbed = series
    ? "figure:figures!inner(id, name, series, character, scale, imageUrl:image_url)"
    : "figure:figures(id, name, series, character, scale, imageUrl:image_url)"

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
  if (sort === "price_asc") query = query.order("price", { ascending: true })
  else if (sort === "price_desc") query = query.order("price", { ascending: false })
  else query = query.order("created_at", { ascending: false })

  const [{ data: listings }, topSeries] = await Promise.all([query, getTopSeries()])

  const filtered = (listings || []) as any[]

  return (
    <Suspense fallback={<ShopSkeleton />}>
      <ShopPageContent
        listings={filtered as any}
        priceRange={price}
        sort={sort}
        series={series}
        topSeries={topSeries}
        dict={en}
        shopBasePath="/shop"
      />
    </Suspense>
  )
}
