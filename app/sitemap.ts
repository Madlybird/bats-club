import { MetadataRoute } from "next"
import { supabaseAdmin } from "@/lib/supabase"

const BASE = "https://batsclub.com"
const LOCALES = ["", "/ru", "/jp"]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = []

  // Static pages
  const staticPages = ["/", "/archive", "/shop", "/articles", "/faq", "/privacy", "/terms"]
  for (const page of staticPages) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${BASE}${locale}${page === "/" && locale ? "" : page}`,
        lastModified: new Date(),
        changeFrequency: page === "/" || page === "/archive" || page === "/shop" ? "daily" : "monthly",
        priority: page === "/" ? 1 : page === "/archive" || page === "/shop" ? 0.9 : 0.5,
      })
    }
  }

  // Figure pages
  try {
    const { data: figures } = await supabaseAdmin
      .from("figures")
      .select("id, slug, created_at")
      .order("created_at", { ascending: false })

    for (const fig of figures || []) {
      const identifier = (fig as any).slug || fig.id
      for (const locale of LOCALES) {
        entries.push({
          url: `${BASE}${locale}/figures/${identifier}`,
          lastModified: fig.created_at ? new Date(fig.created_at) : new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        })
      }
    }
  } catch (e) {
    console.error("[sitemap] figures query failed:", e)
  }

  // Article pages
  try {
    const { data: articles } = await supabaseAdmin
      .from("articles")
      .select("id, slug, created_at")
      .eq("published", true)
      .order("created_at", { ascending: false })

    for (const art of articles || []) {
      const identifier = art.slug || art.id
      for (const locale of LOCALES) {
        entries.push({
          url: `${BASE}${locale}/articles/${identifier}`,
          lastModified: art.created_at ? new Date(art.created_at) : new Date(),
          changeFrequency: "weekly",
          priority: 0.6,
        })
      }
    }
  } catch (e) {
    console.error("[sitemap] articles query failed:", e)
  }

  return entries
}
