import { Suspense } from "react"
import type { Metadata } from "next"
import { supabaseAdmin } from "@/lib/supabase"
import ShopPageContent from "@/components/ShopPageContent"
import { ru } from "@/lib/dict"
import { parsePriceRange } from "@/lib/price-range"

export const metadata: Metadata = {
  title: "Купить редкие аниме-фигурки | Bats Club",
  description:
    "Магазин подлинных винтажных аниме-фигурок из частной японской коллекции. Доставка по миру. Все фигурки проверены и описаны.",
}

// Listing counts must always be accurate (no ISR window) — this route
// already reads searchParams so it renders dynamically anyway.
export const dynamic = "force-dynamic"
// See app/shop/page.tsx — force-dynamic alone doesn't stop a
// fixed-shape query from sticking in the Data Cache.
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

  return Object.entries(counts)
    .map(([series, count]) => ({ series, count, views: viewsMap[series] ?? 0 }))
    .sort((a, b) => b.views - a.views || b.count - a.count)
    .slice(0, 5)
}

export default async function ShopPageRu({ searchParams }: Props) {
  const { price, sort, series } = searchParams

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
        dict={ru}
        shopBasePath="/ru/shop"
      />
    </Suspense>
  )
}
