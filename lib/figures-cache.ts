import { cache } from "react"
import { unstable_cache } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase"
import { isHiddenFigure } from "@/lib/hidden"

export interface FigureListRow {
  id: string
  slug: string | null
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
// (en/ru/jp). Cached under the "figures" tag: every figure/listing write
// path (API routes, Stripe webhook, Telegram bot via /api/admin/revalidate)
// calls revalidateTag("figures", { expire: 0 }), so the archive count and
// for-sale state update on the next request. The 1h revalidate is a safety
// net for direct DB edits; public wishlist counts may lag up to that hour.
//
// Note: per-user "userStatus" is intentionally NOT included here — it's
// hydrated client-side via UserFiguresProvider after mount.
const getFiguresForListCached = unstable_cache(
  async (): Promise<FigureListRow[]> => {
    const { data, error } = await supabaseAdmin
      .from("figures")
      .select(
        "id, slug, name, series, character, manufacturer, scale, year, imageUrl:image_url, isMature:is_mature, " +
          "wishlist_agg:user_figures(status), " +
          "listings(id, active, price, condition)",
      )
      // Only WISHLIST rows are needed for the count — don't ship every
      // user's HAVE/BUY rows too.
      .eq("wishlist_agg.status", "WISHLIST")
      .order("created_at", { ascending: false })

    // Throw rather than cache an empty archive for an hour on a DB blip.
    if (error) throw new Error(`[figures-cache] query failed: ${error.message}`)

    return (data || []).filter((f: any) => !isHiddenFigure(f.id)).map((f: any) => {
      const activeListings = (f.listings || []).filter((l: any) => l.active)
      const cheapest = activeListings.length > 0
        ? activeListings.reduce((a: any, b: any) => (a.price <= b.price ? a : b))
        : null
      return {
        id: f.id,
        slug: f.slug ?? null,
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
  },
  ["figures-for-list-v1"],
  { tags: ["figures"], revalidate: 3600 },
)

// React cache() dedupes the call between generateMetadata and the page
// body within one render.
export const getFiguresForList = cache(getFiguresForListCached)
