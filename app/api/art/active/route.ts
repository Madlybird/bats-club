import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

// Cheap "does the /art section have anything?" check for <Navbar> — the art
// link only shows once there's at least one active art listing (spec: don't
// link to an empty page). Edge-cached for 5 min; staleness here is harmless.
export const revalidate = 300

export async function GET() {
  try {
    // Same check for /books — one request serves both nav links.
    const [art, books] = await Promise.all([
      supabaseAdmin.from("listings").select("id").eq("active", true).not("art_id", "is", null).limit(1),
      supabaseAdmin.from("listings").select("id").eq("active", true).not("book_id", "is", null).limit(1),
    ])

    const active = !art.error && !!art.data && art.data.length > 0
    const booksActive = !books.error && !!books.data && books.data.length > 0
    return NextResponse.json(
      { active, books: booksActive },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } },
    )
  } catch {
    return NextResponse.json({ active: false, books: false })
  }
}
