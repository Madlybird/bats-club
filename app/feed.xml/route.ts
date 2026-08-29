import { supabaseAdmin } from "@/lib/supabase"
import { SHIPPING_COUNTRIES } from "@/lib/listing-jsonld"

export const revalidate = 3600

const BASE = "https://batsclub.com"

// Figures excluded from the Google Merchant feed entirely — e.g. items
// sourced from 18+ adult games/expansions. Undeclared adult content can
// get the whole Merchant account suspended, not just the one item, so
// these stay sellable on batsclub.com but never get submitted to Google.
const EXCLUDED_FROM_FEED = new Set([
  "e9ecf155-fd07-4520-a476-93bd0539eff8", // ToHeart2 XRATED — Sasara Kusugawa
])

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
  condition: string
  photos: unknown
  figure: FigureRow | FigureRow[] | null
}

// photos/images may be a native array (jsonb) or a JSON string depending
// on the query path — mirrors parseImages() in app/shop/[id]/page.tsx.
function allImages(raw: unknown): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.filter((u): u is string => typeof u === "string")
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed.filter((u): u is string => typeof u === "string") : []
    } catch {
      return []
    }
  }
  return []
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("listings")
    .select(
      "id, price, stock, condition, photos, figure:figures(id, slug, name, series, manufacturer, description, image_url, images)"
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
      if (EXCLUDED_FROM_FEED.has(figure.id)) return ""

      // Link to the specific listing page (/shop/{id}), not the figure
      // page — the figure page shows the *cheapest* listing's price via
      // its own JSON-LD, which can differ from this item's price if the
      // same figure has more than one active listing. Must match exactly.
      const priceUsd = (row.price / 100).toFixed(2)
      const title = `${figure.name} — ${figure.series}`
      // Bare title as a description reads as thin/duplicate content to
      // Merchant when the figure has no description of its own yet —
      // pad it with manufacturer/condition so it's not just the title twice.
      const description = figure.description
        || `${title}. ${figure.manufacturer ? `By ${figure.manufacturer}. ` : ""}Condition: ${row.condition}.`
      const listingImages = allImages(row.photos)
      const figureImages = allImages(figure.images)
      const images = listingImages.length > 0
        ? listingImages
        : figureImages.length > 0
        ? figureImages
        : figure.image_url
        ? [figure.image_url]
        : []
      const imageLink = images[0] || ""
      // Google Merchant accepts up to 10 additional_image_link entries.
      const additionalImageLinks = images
        .slice(1, 11)
        .map((u) => `    <g:additional_image_link>${xmlEscape(u)}</g:additional_image_link>`)
        .join("\n")

      return `  <item>
    <g:id>${xmlEscape(row.id)}</g:id>
    <title>${xmlEscape(title)}</title>
    <description>${xmlEscape(description)}</description>
    <link>${BASE}/shop/${xmlEscape(row.id)}</link>
    <g:image_link>${xmlEscape(imageLink)}</g:image_link>${additionalImageLinks ? `\n${additionalImageLinks}` : ""}
    <g:price>${priceUsd} USD</g:price>
    <g:availability>in stock</g:availability>
    <g:condition>used</g:condition>
    <g:brand>${xmlEscape(figure.manufacturer || "Unknown")}</g:brand>
    <g:color>Multicolor</g:color>
    <g:identifier_exists>false</g:identifier_exists>
    <g:product_type>Anime Figures</g:product_type>
    <g:google_product_category>Toys &amp; Games &gt; Toys &gt; Action Figures</g:google_product_category>
${SHIPPING_COUNTRIES.map(({ country, price }) => `    <g:shipping>
      <g:country>${country}</g:country>
      <g:price>${price} USD</g:price>
    </g:shipping>`).join("\n")}
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
