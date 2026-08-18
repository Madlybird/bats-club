import { NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { isHiddenFigure } from "@/lib/hidden"

export async function GET(_req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  if (isHiddenFigure(params.id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
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
        article:articles(id, title, slug, excerpt, published, coverImage:cover_image, createdAt:created_at)
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

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
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

  const { data: slugRow } = await supabaseAdmin
    .from("figures")
    .select("slug")
    .eq("id", params.id)
    .maybeSingle()
  const slugForPath = slugRow?.slug || params.id
  revalidateTag("figures")
  revalidatePath("/")
  revalidatePath("/jp")
  revalidatePath("/ru")
  revalidatePath(`/figures/${slugForPath}`)
  revalidatePath(`/jp/figures/${slugForPath}`)
  revalidatePath(`/ru/figures/${slugForPath}`)
  // Slug and id resolve to different cache entries (generateStaticParams
  // pre-renders at the UUID path, archive links can hit either). Cover
  // both concrete paths instead of invalidating the whole dynamic route
  // template, which would regenerate every other figure page too.
  if (slugForPath !== params.id) {
    revalidatePath(`/figures/${params.id}`)
    revalidatePath(`/jp/figures/${params.id}`)
    revalidatePath(`/ru/figures/${params.id}`)
  }

  return NextResponse.json(figure)
}

export async function DELETE(_req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Slug is only readable before the row is gone — fetch it first so the
  // post-delete revalidation can still target the slug-based cache entry.
  const { data: slugRow } = await supabaseAdmin
    .from("figures")
    .select("slug")
    .eq("id", params.id)
    .maybeSingle()
  const slugForPath = slugRow?.slug || params.id

  const { error } = await supabaseAdmin.from("figures").delete().eq("id", params.id)

  if (error) {
    console.error("Delete figure error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }

  revalidateTag("figures")
  revalidatePath(`/figures/${slugForPath}`)
  revalidatePath(`/jp/figures/${slugForPath}`)
  revalidatePath(`/ru/figures/${slugForPath}`)
  if (slugForPath !== params.id) {
    revalidatePath(`/figures/${params.id}`)
    revalidatePath(`/jp/figures/${params.id}`)
    revalidatePath(`/ru/figures/${params.id}`)
  }
  revalidatePath("/")
  revalidatePath("/jp")
  revalidatePath("/ru")

  return NextResponse.json({ success: true })
}
