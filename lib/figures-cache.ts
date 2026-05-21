import { unstable_cache } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase"

export interface FigureListRow {
  id: string
  name: string
  series: string
  character: string
  manufacturer: string
  scale: string
  year: number
  imageUrl: string | null
  wishlistCount: number
  _count: { listings: number }
  cheapestListing: { id: string; price: number; condition: string } | null
}

// Single source of truth for the figure-grid query used by /archive
// (en/ru/jp). Wrapped in unstable_cache so all three locales share one
// upstream Supabase fetch. Invalidated by revalidateTag("figures").
//
// Note: per-user "userStatus" is intentionally NOT included here — that
// would defeat the shared cache. It's hydrated client-side via
// UserFiguresProvider after mount.
export const getFiguresForList = unstable_cache(
  async (): Promise<FigureListRow[]> => {
    const { data, error } = await supabaseAdmin
      .from("figures")
      .select(
        "id, name, series, character, manufacturer, scale, year, imageUrl:image_url, " +
          "wishlist_agg:user_figures(status), " +
          "listings(id, active, price, condition)",
      )
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[figures-cache] query failed:", error)
      return []
    }

    return (data || []).map((f: any) => {
      const activeListings = (f.listings || []).filter((l: any) => l.active)
      const cheapest = activeListings.length > 0
        ? activeListings.reduce((a: any, b: any) => (a.price <= b.price ? a : b))
        : null
      return {
        id: f.id,
        name: f.name,
        series: f.series,
        character: f.character,
        manufacturer: f.manufacturer,
        scale: f.scale,
        year: f.year,
        imageUrl: f.imageUrl,
        wishlistCount: (f.wishlist_agg || []).filter(
          (uf: any) => uf.status === "WISHLIST",
        ).length,
        _count: { listings: activeListings.length },
        cheapestListing: cheapest
          ? { id: cheapest.id, price: cheapest.price, condition: cheapest.condition }
          : null,
      }
    })
  },
  ["figures-for-list-v1"],
  { tags: ["figures"], revalidate: 3600 },
)
