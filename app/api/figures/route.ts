import { NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { insertFigureWithSlug } from "@/lib/slug"
import { sanitizePostgrestTerm } from "@/lib/sanitize"
import { isHiddenFigure } from "@/lib/hidden"

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
  if (q) {
    // Strip PostgREST filter delimiters so the term can't break out of
    // the ilike expression and inject extra filters / column refs.
    const safe = sanitizePostgrestTerm(q)
    if (safe) {
      query = query.or(`name.ilike.%${safe}%,character.ilike.%${safe}%,series.ilike.%${safe}%`)
    }
  }

  const { data: figures, error } = await query

  if (error) {
    console.error("Get figures error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }

  const result = (figures || []).filter((f) => !isHiddenFigure(f.id)).map((f) => ({
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

    const { data: figure, error } = await insertFigureWithSlug(
      {
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
      },
      name,
      "id, slug, name, series, character, manufacturer, scale, year, sculptor, material, imageUrl:image_url, description, createdAt:created_at",
    )

    if (error) throw error

    const slugForPath = (figure as any)?.slug || (figure as any)?.id
    revalidateTag("figures")
    revalidatePath("/")
    revalidatePath("/jp")
    revalidatePath("/ru")
    revalidatePath("/archive")
    revalidatePath("/jp/archive")
    revalidatePath("/ru/archive")
    if (slugForPath) {
      revalidatePath(`/figures/${slugForPath}`)
      revalidatePath(`/jp/figures/${slugForPath}`)
      revalidatePath(`/ru/figures/${slugForPath}`)
    }

    return NextResponse.json(figure, { status: 201 })
  } catch (error) {
    console.error("Create figure error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
