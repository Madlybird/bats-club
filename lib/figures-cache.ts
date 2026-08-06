import { supabaseAdmin } from "@/lib/supabase"
import { isHiddenFigure } from "@/lib/hidden"

export interface FigureListRow {
  id: string
  name: string
  series: string
  character: string
  manufacturer: string
  scale: string
  year: number
  imageUrl: string | null
  isMature: boolean
  wishlistCount: number
  _count: { listings: number }
  cheapestListing: { id: string; price: number; condition: string } | null
}

// Single source of truth for the figure-grid query used by /archive
// (en/ru/jp). Queried fresh on every request — the archive figure count
// must always match the database, not lag behind an ISR/data-cache
// window (previously unstable_cache'd for up to an hour).
//
// Note: per-user "userStatus" is intentionally NOT included here — it's
// hydrated client-side via UserFiguresProvider after mount.
export async function getFiguresForList(): Promise<FigureListRow[]> {
  const { data, error } = await supabaseAdmin
    .from("figures")
    .select(
      "id, name, series, character, manufacturer, scale, year, imageUrl:image_url, isMature:is_mature, " +
        "wishlist_agg:user_figures(status), " +
        "listings(id, active, price, condition)",
    )
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[figures-cache] query failed:", error)
    return []
  }

  return (data || []).filter((f: any) => !isHiddenFigure(f.id)).map((f: any) => {
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
      isMature: !!f.isMature,
      wishlistCount: (f.wishlist_agg || []).filter(
        (uf: any) => uf.status === "WISHLIST",
      ).length,
      _count: { listings: activeListings.length },
      cheapestListing: cheapest
        ? { id: cheapest.id, price: cheapest.price, condition: cheapest.condition }
        : null,
    }
  })
}
