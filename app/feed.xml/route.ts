import { supabaseAdmin } from "@/lib/supabase"

export const revalidate = 3600

const BASE = "https://batsclub.com"

function xmlEscape(value: unknown): string {
  if (value === null || value === undefined) return ""
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

interface FigureRow {
  id: string
  slug: string | null
  name: string
  series: string
  manufacturer: string | null
  description: string | null
  image_url: string | null
  images: unknown
}

interface ListingRow {
  id: string
  price: number
  stock: number
  photos: unknown
  figure: FigureRow | FigureRow[] | null
}

function firstImage(raw: unknown): string | null {
  if (!raw) return null
  if (Array.isArray(raw)) return raw.find((u): u is string => typeof u === "string") || null
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed.find((u): u is string => typeof u === "string") || null : null
    } catch {
      return null
    }
  }
  return null
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("listings")
    .select(
      "id, price, stock, photos, figure:figures(id, slug, name, series, manufacturer, description, image_url, images)"
    )
    .eq("active", true)
    .gt("stock", 0)

  if (error) {
    console.error("[feed.xml] supabase error:", error)
    return new Response("Failed to build feed", { status: 500 })
  }

  const rows = (data || []) as unknown as ListingRow[]

  const items = rows
    .map((row) => {
      const figure = Array.isArray(row.figure) ? row.figure[0] : row.figure
      if (!figure) return ""

      // Link to the specific listing page (/shop/{id}), not the figure
      // page — the figure page shows the *cheapest* listing's price via
      // its own JSON-LD, which can differ from this item's price if the
      // same figure has more than one active listing. Must match exactly.
      const priceUsd = (row.price / 100).toFixed(2)
      const title = `${figure.name} — ${figure.series}`
      const imageLink = firstImage(row.photos) || firstImage(figure.images) || figure.image_url || ""

      return `  <item>
    <g:id>${xmlEscape(row.id)}</g:id>
    <title>${xmlEscape(title)}</title>
    <description>${xmlEscape(figure.description || title)}</description>
    <link>${BASE}/shop/${xmlEscape(row.id)}</link>
    <g:image_link>${xmlEscape(imageLink)}</g:image_link>
    <g:price>${priceUsd} USD</g:price>
    <g:availability>in stock</g:availability>
    <g:condition>used</g:condition>
    <g:brand>${xmlEscape(figure.manufacturer || "Unknown")}</g:brand>
    <g:mpn>${xmlEscape(figure.id)}</g:mpn>
    <g:product_type>Anime Figures</g:product_type>
    <g:shipping>
      <g:country>US</g:country>
      <g:price>12 USD</g:price>
    </g:shipping>
    <g:shipping>
      <g:country>JP</g:country>
      <g:price>17 USD</g:price>
    </g:shipping>
    <g:shipping>
      <g:country>GB</g:country>
      <g:price>12 USD</g:price>
    </g:shipping>
    <g:shipping>
      <g:country>RU</g:country>
      <g:price>9 USD</g:price>
    </g:shipping>
  </item>`
    })
    .filter(Boolean)
    .join("\n")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
  <title>Bats Club</title>
  <link>${BASE}</link>
  <description>Authentic rare Japanese anime figures from a private 1990s–2000s collection.</description>
${items}
</channel>
</rss>`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
