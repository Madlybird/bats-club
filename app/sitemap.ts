import { MetadataRoute } from "next"
import { supabaseAdmin } from "@/lib/supabase"

const BASE = "https://batsclub.com"
const LOCALES = ["", "/ru", "/jp"]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = []

  // Static pages
  const staticPages = ["/", "/archive", "/shop", "/articles", "/faq", "/privacy", "/terms", "/about"]
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

  // Figure pages — prefer slug when available, fall back to id if the
  // slug column hasn't been added yet.
  try {
    let figures: { id: string; slug?: string | null; created_at: string | null; image_url?: string | null }[] = []
    const withSlug = await supabaseAdmin
      .from("figures")
      .select("id, slug, created_at, image_url")
      .order("created_at", { ascending: false })
    if (withSlug.error) {
      const { data } = await supabaseAdmin
        .from("figures")
        .select("id, created_at, image_url")
        .order("created_at", { ascending: false })
      figures = (data || []) as any
    } else {
      figures = (withSlug.data || []) as any
    }

    for (const fig of figures) {
      const identifier = (fig as any).slug || fig.id
      for (const locale of LOCALES) {
        entries.push({
          url: `${BASE}${locale}/figures/${identifier}`,
          lastModified: fig.created_at ? new Date(fig.created_at) : new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
          ...(fig.image_url ? { images: [fig.image_url] } : {}),
        })
      }
    }
  } catch (e) {
    console.error("[sitemap] figures query failed:", e)
  }

  // Listing pages — individual /shop/[id] product pages weren't in the
  // sitemap before; Google only found them via internal links, which
  // slows discovery of new listings.
  try {
    const { data: listings } = await supabaseAdmin
      .from("listings")
      .select("id, created_at, photos, figure:figures(image_url)")
      .eq("active", true)
      .order("created_at", { ascending: false })

    for (const listing of (listings || []) as any[]) {
      // photos may come back as a native array (jsonb) or a JSON string,
      // depending on the query path — mirrors parseImages() in
      // components/FigureDetailContent.tsx / app/shop/[id]/page.tsx.
      let photos: unknown = listing.photos
      if (typeof photos === "string") {
        try { photos = JSON.parse(photos) } catch { photos = [] }
      }
      const listingImage = Array.isArray(photos) && photos.length > 0 ? photos[0] : null
      const figureEmbed = Array.isArray(listing.figure) ? listing.figure[0] : listing.figure
      const image = listingImage || figureEmbed?.image_url || null

      for (const locale of LOCALES) {
        entries.push({
          url: `${BASE}${locale}/shop/${listing.id}`,
          lastModified: listing.created_at ? new Date(listing.created_at) : new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
          ...(image ? { images: [image] } : {}),
        })
      }
    }
  } catch (e) {
    console.error("[sitemap] listings query failed:", e)
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
