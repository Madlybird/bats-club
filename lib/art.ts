import { cache } from "react"
import { supabaseAdmin } from "@/lib/supabase"

// Single source of truth for the /art queries (en/ru/jp). Art lives in its own
// `art` table; the sellable row is a `listings` row with `art_id` set (and
// `figure_id` null). Everything here is keyed on the listing id — that's the
// /art/<id> route param, mirroring /shop/<id>.

export const ART_TYPES = [
  "Poster",
  "Digital Print",
  "Postcard",
  "Sticker",
  "Canvas",
  "Zine",
] as const
export type ArtType = (typeof ART_TYPES)[number]

export interface ArtListRow {
  id: string // listing id
  artId: string
  title: string
  artist: string
  type: string
  series: string | null
  size: string
  isMature: boolean
  price: number
  stock: number
  coverImage: string | null
  createdAt: string | null
}

export interface ArtDetailRow extends ArtListRow {
  year: number | null
  material: string | null
  edition: string | null
  description: string | null
  descriptionRu: string | null
  descriptionJp: string | null
  photos: string[]
}

function parseImages(raw: unknown): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.filter((u): u is string => typeof u === "string")
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw)
      return Array.isArray(p) ? p.filter((u): u is string => typeof u === "string") : []
    } catch {
      return []
    }
  }
  return []
}

function one<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null
  return v ?? null
}

// Queried fresh on every request (route is force-dynamic) so the count and
// stock badges always match the DB. Wrapped in React's request cache so
// generateMetadata and the page body share one query.
export const getArtForList = cache(async (): Promise<ArtListRow[]> => {
  const { data, error } = await supabaseAdmin
    .from("listings")
    .select(
      "id, price, stock, photos, created_at, " +
        "art:art!inner(id, title, artist, type, series, size, is_mature)",
    )
    .eq("active", true)
    .not("art_id", "is", null)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[art] list query failed:", error)
    return []
  }

  return ((data as any[]) || [])
    .map((row: any): ArtListRow | null => {
      const a = one<any>(row.art)
      if (!a) return null
      return {
        id: row.id,
        artId: a.id,
        title: a.title,
        artist: a.artist,
        type: a.type,
        series: a.series ?? null,
        size: a.size,
        isMature: !!a.is_mature,
        price: row.price,
        stock: row.stock ?? 0,
        coverImage: parseImages(row.photos)[0] ?? null,
        createdAt: row.created_at ?? null,
      }
    })
    .filter((r): r is ArtListRow => r !== null)
})

export async function getArtItem(listingId: string): Promise<ArtDetailRow | null> {
  const { data, error } = await supabaseAdmin
    .from("listings")
    .select(
      "id, price, stock, photos, created_at, active, " +
        "art:art(id, title, artist, type, series, size, year, material, edition, " +
        "description, description_ru, description_jp, is_mature)",
    )
    .eq("id", listingId)
    .maybeSingle()

  if (error) {
    console.error("[art] item query failed:", error)
    return null
  }
  const row = data as any
  if (!row || !row.active) return null
  const a = one<any>(row.art)
  if (!a) return null // this listing is a figure, not art

  const photos = parseImages(row.photos)
  return {
    id: row.id,
    artId: a.id,
    title: a.title,
    artist: a.artist,
    type: a.type,
    series: a.series ?? null,
    size: a.size,
    isMature: !!a.is_mature,
    price: row.price,
    stock: row.stock ?? 0,
    coverImage: photos[0] ?? null,
    createdAt: row.created_at ?? null,
    year: a.year ?? null,
    material: a.material ?? null,
    edition: a.edition ?? null,
    description: a.description ?? null,
    descriptionRu: a.description_ru ?? null,
    descriptionJp: a.description_jp ?? null,
    photos,
  }
}

// Recent art listing ids for generateStaticParams on /art/[id] (mirrors
// app/shop/[id]). Bounded — dynamicParams covers the rest on-demand.
export async function getRecentArtListingIds(limit = 100): Promise<string[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("listings")
      .select("id")
      .eq("active", true)
      .not("art_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(limit)
    if (error) return []
    return (data || []).map((r: { id: string }) => r.id)
  } catch {
    return []
  }
}
