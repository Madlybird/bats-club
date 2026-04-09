import { supabaseAdmin } from "@/lib/supabase"
import ShopPageContent from "@/components/ShopPageContent"
import { ru } from "@/lib/dict"

export const revalidate = 30

interface Props { searchParams: { condition?: string; sort?: string; series?: string } }

async function getTopSeries() {
  const { data } = await supabaseAdmin
    .from("series_views")
    .select("series, views")
    .order("views", { ascending: false })
    .limit(5)
  if (!data || data.length === 0) {
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
  return data.map((r: any) => ({ series: r.series, count: r.views }))
}

export default async function ShopPageRu({ searchParams }: Props) {
  const { condition, sort, series } = searchParams

  let query = supabaseAdmin
    .from("listings")
    .select(`
      id, price, condition, stock, photos, description, active,
      figureId:figure_id, sellerId:seller_id, createdAt:created_at,
      figure:figures(id, name, series, character, scale, imageUrl:image_url),
      seller:users(id, name, username)
    `)
    .eq("active", true)

  if (condition) query = query.eq("condition", condition)
  if (sort === "price_asc") query = query.order("price", { ascending: true })
  else if (sort === "price_desc") query = query.order("price", { ascending: false })
  else query = query.order("created_at", { ascending: false })

  const [{ data: listings }, topSeries] = await Promise.all([query, getTopSeries()])

  const filtered = series
    ? (listings || []).filter((l: any) => {
        const fig = Array.isArray(l.figure) ? l.figure[0] : l.figure
        return fig?.series === series
      })
    : (listings || [])

  return (
    <ShopPageContent
      listings={filtered as any}
      condition={condition}
      sort={sort}
      series={series}
      topSeries={topSeries}
      dict={ru}
      shopBasePath="/ru/shop"
    />
  )
}
