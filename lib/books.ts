import { cache } from "react"
import { supabaseAdmin } from "@/lib/supabase"

// Single source of truth for the /books queries (en/ru/jp). Books live in
// their own `books` table; the sellable row is a `listings` row with
// `book_id` set. Everything here is keyed on the listing id — the
// /books/<id> route param, mirroring /art/<id> and /shop/<id>.
//
// Books are second-hand copies from the owner's collection: one copy per
// listing, with a condition grade and an "includes" list (obi, slipcase…).

export { BOOK_TYPES, BOOK_CONDITIONS, type BookType, type BookCondition } from "@/lib/books-constants"

export interface BookListRow {
  id: string // listing id
  bookId: string
  title: string
  titleOriginal: string | null
  type: string
  author: string | null
  publisher: string | null
  series: string | null
  language: string | null
  year: number | null
  condition: string
  includes: string[]
  isMature: boolean
  price: number
  stock: number
  weightG: number
  coverImage: string | null
  createdAt: string | null
}

export interface BookDetailRow extends BookListRow {
  isbn: string | null
  pages: number | null
  size: string | null
  binding: string | null
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

export function parseIncludes(raw: string | null | undefined): string[] {
  if (!raw) return []
  return raw
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

const LIST_BOOK_COLS =
  "id, title, title_original, type, author, publisher, series, language, year, includes, weight_g, is_mature"

function toListRow(row: any, b: any): BookListRow {
  return {
    id: row.id,
    bookId: b.id,
    title: b.title,
    titleOriginal: b.title_original ?? null,
    type: b.type,
    author: b.author ?? null,
    publisher: b.publisher ?? null,
    series: b.series ?? null,
    language: b.language ?? null,
    year: b.year ?? null,
    condition: row.condition ?? "Good",
    includes: parseIncludes(b.includes),
    isMature: !!b.is_mature,
    price: row.price,
    stock: row.stock ?? 0,
    weightG: b.weight_g ?? 0,
    coverImage: parseImages(row.photos)[0] ?? null,
    createdAt: row.created_at ?? null,
  }
}

// Fresh on every request (route is force-dynamic) so counts and stock match
// the DB; React's request cache shares one query with generateMetadata.
export const getBooksForList = cache(async (): Promise<BookListRow[]> => {
  const { data, error } = await supabaseAdmin
    .from("listings")
    .select(`id, price, stock, condition, photos, created_at, book:books!inner(${LIST_BOOK_COLS})`)
    .eq("active", true)
    .not("book_id", "is", null)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[books] list query failed:", error)
    return []
  }
  return ((data as any[]) || [])
    .map((row: any) => {
      const b = one<any>(row.book)
      return b ? toListRow(row, b) : null
    })
    .filter((r): r is BookListRow => r !== null)
})

export async function getBookItem(listingId: string): Promise<BookDetailRow | null> {
  const { data, error } = await supabaseAdmin
    .from("listings")
    .select(
      `id, price, stock, condition, photos, created_at, active, ` +
        `book:books(${LIST_BOOK_COLS}, isbn, pages, size, binding, description, description_ru, description_jp)`,
    )
    .eq("id", listingId)
    .maybeSingle()

  if (error) {
    console.error("[books] item query failed:", error)
    return null
  }
  const row = data as any
  if (!row || !row.active) return null
  const b = one<any>(row.book)
  if (!b) return null // a figure or art listing, not a book

  const photos = parseImages(row.photos)
  return {
    ...toListRow(row, b),
    isbn: b.isbn ?? null,
    pages: b.pages ?? null,
    size: b.size ?? null,
    binding: b.binding ?? null,
    description: b.description ?? null,
    descriptionRu: b.description_ru ?? null,
    descriptionJp: b.description_jp ?? null,
    photos,
  }
}

// Recent book listing ids for generateStaticParams on /books/[id].
export async function getRecentBookListingIds(limit = 100): Promise<string[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("listings")
      .select("id")
      .eq("active", true)
      .not("book_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(limit)
    if (error) return []
    return (data || []).map((r: { id: string }) => r.id)
  } catch {
    return []
  }
}

// Other active items from the same series (books + art) for the
// "From the same series" strip on a book page.
export async function getSameSeriesBooks(series: string, excludeListingId: string, limit = 4): Promise<BookListRow[]> {
  if (!series) return []
  const all = await getBooksForList()
  const s = series.toLowerCase()
  return all.filter((b) => b.id !== excludeListingId && (b.series ?? "").toLowerCase() === s).slice(0, limit)
}
