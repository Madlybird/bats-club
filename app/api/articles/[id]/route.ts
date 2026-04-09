import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  // Support lookup by slug OR id
  const { data: article, error } = await supabaseAdmin
    .from("articles")
    .select(`
      id, title, slug, body, excerpt, published,
      coverImage:cover_image, authorId:author_id,
      createdAt:created_at, updatedAt:updated_at,
      author:users(id, name, username, avatar, bio),
      article_figures(
        figure:figures(id, name, series, character, scale, manufacturer, imageUrl:image_url)
      )
    `)
    .or(`id.eq.${params.id},slug.eq.${params.id}`)
    .single()

  if (error || !article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({
    ...article,
    articleFigures: (article.article_figures || []).map((af: any) => ({ figure: af.figure })),
  })
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { title, body, excerpt, coverImage, figureIds, published, slug } = await req.json()

  // Delete existing figure links and re-create
  await supabaseAdmin.from("article_figures").delete().eq("article_id", params.id)

  const updateData: Record<string, any> = {
    title,
    body,
    excerpt: excerpt || null,
    cover_image: coverImage || null,
    published: published ?? false,
  }
  if (slug) updateData.slug = slug

  const { data: article, error } = await supabaseAdmin
    .from("articles")
    .update(updateData)
    .eq("id", params.id)
    .select("id, title, slug, published, coverImage:cover_image, createdAt:created_at, author:users(name, username)")
    .single()

  if (error) {
    console.error("Update article error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }

  if (figureIds?.length) {
    await supabaseAdmin.from("article_figures").insert(
      figureIds.map((fid: string) => ({ article_id: params.id, figure_id: fid }))
    )
  }

  // Fetch updated with figure links
  const { data: fullArticle } = await supabaseAdmin
    .from("articles")
    .select(`
      id, title, slug, published, coverImage:cover_image, createdAt:created_at,
      author:users(name, username),
      article_figures(figure:figures(name))
    `)
    .eq("id", params.id)
    .single()

  return NextResponse.json({
    ...fullArticle,
    articleFigures: ((fullArticle as any)?.article_figures || []).map((af: any) => ({ figure: af.figure })),
  })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { error } = await supabaseAdmin.from("articles").delete().eq("id", params.id)

  if (error) {
    console.error("Delete article error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { published } = await req.json()

  const { data: article, error } = await supabaseAdmin
    .from("articles")
    .update({ published })
    .eq("id", params.id)
    .select("id, title, slug, published, createdAt:created_at")
    .single()

  if (error) {
    console.error("Patch article error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }

  return NextResponse.json(article)
}
