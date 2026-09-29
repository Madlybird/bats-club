import { supabaseAdmin } from "@/lib/supabase"

export interface HomeCollection {
  id: string
  slug: string
  name: string
  figures: { id: string; name: string; series: string; imageUrl?: string | null }[]
}

export interface ShopCollection {
  slug: string
  name: string
  count: number
}

// Collections meant to appear as pills on /shop. Deliberately NOT "all
// active collections" — most of those (Range Murata, Di Gi Charat, ToHeart2,
// Weekly Dearest My Brother) already duplicate an existing series pill
// one-for-one and just showed the same franchise twice under two counts.
// Only cross-series themes and franchises that don't already have a clean
// series pill belong here. Keep in sync with scripts/seed-shop-categories.mjs.
export const SHOP_COLLECTION_SLUGS = ["ghost-in-the-shell", "wonder-festival", "maid-cafe", "vintage-gashapon"]

// Collections that exist to power the /shop filter row and should NOT
// appear in the homepage's per-franchise collections sliders.
const SHOP_ONLY_COLLECTION_SLUGS = new Set(["maid-cafe", "vintage-gashapon"])

// Fetches active collections for the homepage. Tolerant of the tables
// not existing yet (migration 007 not applied) — returns [] so the
// homepage renders without the collections section instead of erroring.
export async function getHomeCollections(
  locale: "en" | "ru" | "jp"
): Promise<HomeCollection[]> {
  const { data, error } = await supabaseAdmin
    .from("collections")
    .select(
      `id, slug, nameEn:name_en, nameRu:name_ru, nameJp:name_jp, active, position,
       collection_figures(
         position,
         figure:figures(id, name, series, imageUrl:image_url)
       )`
    )
    .eq("active", true)
    .order("position", { ascending: true })

  if (error || !data) return []

  return data
    .filter((c: any) => !SHOP_ONLY_COLLECTION_SLUGS.has(c.slug))
    .map((c: any) => ({
      id: c.id,
      slug: c.slug,
      name:
        (locale === "ru" ? c.nameRu : locale === "jp" ? c.nameJp : c.nameEn) ||
        c.nameEn,
      figures: (c.collection_figures || [])
        .slice()
        .sort((a: any, b: any) => a.position - b.position)
        .map((cf: any) => cf.figure)
        .filter(Boolean),
    }))
    .filter((c: HomeCollection) => c.figures.length > 0)
}
