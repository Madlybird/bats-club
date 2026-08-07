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

// Themed collections (e.g. "Maid & Cafe", "Vintage Gashapon") shown as a
// filter row on /shop, alongside the existing series-based SeriesBar.
// Reuses the same collections/collection_figures tables as the homepage
// sliders — a collection only shows here if it has at least one figure
// with an active listing (out of stock/inactive-only collections stay
// homepage-only rather than dead-ending shop visitors).
export async function getShopCollections(
  locale: "en" | "ru" | "jp"
): Promise<ShopCollection[]> {
  const { data, error } = await supabaseAdmin
    .from("collections")
    .select(
      `slug, nameEn:name_en, nameRu:name_ru, nameJp:name_jp, active, position,
       collection_figures(
         figure:figures(id, listings(active))
       )`
    )
    .eq("active", true)
    .order("position", { ascending: true })

  if (error || !data) return []

  return data
    .map((c: any) => {
      const count = (c.collection_figures || []).filter((cf: any) =>
        (cf.figure?.listings || []).some((l: any) => l.active)
      ).length
      return {
        slug: c.slug,
        name: (locale === "ru" ? c.nameRu : locale === "jp" ? c.nameJp : c.nameEn) || c.nameEn,
        count,
      }
    })
    .filter((c: ShopCollection) => c.count > 0)
}

// Figure ids belonging to a collection — used to filter the /shop listings
// query when a visitor selects a collection pill.
export async function getCollectionFigureIds(slug: string): Promise<string[] | null> {
  const { data, error } = await supabaseAdmin
    .from("collections")
    .select("collection_figures(figure_id)")
    .eq("slug", slug)
    .maybeSingle()

  if (error || !data) return null
  return (data as any).collection_figures.map((cf: any) => cf.figure_id)
}

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
