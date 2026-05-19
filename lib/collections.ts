import { supabaseAdmin } from "@/lib/supabase"

export interface HomeCollection {
  id: string
  slug: string
  name: string
  figures: { id: string; name: string; series: string; imageUrl?: string | null }[]
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
