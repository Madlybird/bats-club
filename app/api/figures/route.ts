import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const series = searchParams.get("series")
  const manufacturer = searchParams.get("manufacturer")
  const q = searchParams.get("q")

  let query = supabaseAdmin
    .from("figures")
    .select("id, name, series, character, manufacturer, scale, year, sculptor, material, imageUrl:image_url, description, createdAt:created_at, user_figures(status), listings(id)")
    .order("created_at", { ascending: false })

  if (series) query = query.eq("series", series)
  if (manufacturer) query = query.eq("manufacturer", manufacturer)
  if (q) query = query.or(`name.ilike.%${q}%,character.ilike.%${q}%,series.ilike.%${q}%`)

  const { data: figures, error } = await query

  if (error) {
    console.error("Get figures error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }

  const result = (figures || []).map((f) => ({
    ...f,
    userFigures: f.user_figures || [],
    _count: { listings: (f.listings || []).length },
    wishlistCount: (f.user_figures || []).filter((uf: any) => uf.status === "WISHLIST").length,
  }))

  return NextResponse.json(result)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { name, series, character, manufacturer, scale, year, sculptor, material, imageUrl, description } = body

    if (!name || !series || !character || !manufacturer || !scale || !year) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data: figure, error } = await supabaseAdmin
      .from("figures")
      .insert({
        name,
        series,
        character,
        manufacturer,
        scale,
        year: parseInt(year),
        sculptor: sculptor || null,
        material: material || null,
        image_url: imageUrl || null,
        description: description || null,
      })
      .select("id, name, series, character, manufacturer, scale, year, sculptor, material, imageUrl:image_url, description, createdAt:created_at")
      .single()

    if (error) throw error

    return NextResponse.json(figure, { status: 201 })
  } catch (error) {
    console.error("Create figure error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
