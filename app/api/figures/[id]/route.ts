import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { data: figure, error } = await supabaseAdmin
    .from("figures")
    .select(`
      id, name, series, character, manufacturer, scale, year, sculptor, material,
      imageUrl:image_url, description, createdAt:created_at,
      user_figures(status),
      listings(
        id, price, condition, stock, photos, description, active, createdAt:created_at,
        seller:users(id, name, username)
      ),
      article_figures(
        article:articles(id, title, slug, excerpt, published)
      )
    `)
    .eq("id", params.id)
    .eq("listings.active", true)
    .single()

  if (error || !figure) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({
    ...figure,
    userFigures: figure.user_figures || [],
    articleFigures: (figure.article_figures || []).map((af: any) => ({ article: af.article })),
    wishlistCount: (figure.user_figures || []).filter((uf: any) => uf.status === "WISHLIST").length,
  })
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const { name, series, character, manufacturer, scale, year, sculptor, material, imageUrl, description } = body

  const { data: figure, error } = await supabaseAdmin
    .from("figures")
    .update({
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
    .eq("id", params.id)
    .select("id, name, series, character, manufacturer, scale, year, sculptor, material, imageUrl:image_url, description, createdAt:created_at")
    .single()

  if (error) {
    console.error("Update figure error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }

  return NextResponse.json(figure)
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { error } = await supabaseAdmin.from("figures").delete().eq("id", params.id)

  if (error) {
    console.error("Delete figure error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
