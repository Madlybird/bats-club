import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

function errorResponse(stage: string, error: any, status = 500) {
  const payload = {
    error: error?.message || "Request failed",
    stage,
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
  }
  console.error(`[articles/id] ${stage} failed`, payload)
  return NextResponse.json(payload, { status })
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
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

  let stage = "parse-body"
  try {
    const { title, body, excerpt, coverImage, figureIds, published, slug } = await req.json()

    stage = "clear-figure-links"
    const { error: delError } = await supabaseAdmin
      .from("article_figures")
      .delete()
      .eq("article_id", params.id)
    if (delError) return errorResponse(stage, delError)

    const updateData: Record<string, any> = {
      title,
      body,
      excerpt: excerpt || null,
      cover_image: coverImage || null,
      published: published ?? false,
    }
    if (slug) updateData.slug = slug

    stage = "update"
    const { data: article, error } = await supabaseAdmin
      .from("articles")
      .update(updateData)
      .eq("id", params.id)
      .select("id")
      .single()
    if (error || !article) return errorResponse(stage, error || new Error("update returned no row"))

    if (figureIds?.length) {
      stage = "link-figures"
      const { error: linkError } = await supabaseAdmin
        .from("article_figures")
        .insert(figureIds.map((fid: string) => ({ article_id: params.id, figure_id: fid })))
      if (linkError) return errorResponse(stage, linkError)
    }

    stage = "fetch-full"
    const { data: fullArticle, error: fetchError } = await supabaseAdmin
      .from("articles")
      .select(`
        id, title, slug, published, coverImage:cover_image, createdAt:created_at,
        author:users(name, username),
        article_figures(figure:figures(name))
      `)
      .eq("id", params.id)
      .single()
    if (fetchError) return errorResponse(stage, fetchError)

    return NextResponse.json({
      ...fullArticle,
      articleFigures: ((fullArticle as any)?.article_figures || []).map((af: any) => ({ figure: af.figure })),
    })
  } catch (error: any) {
    return errorResponse(stage, error)
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { error } = await supabaseAdmin.from("articles").delete().eq("id", params.id)
  if (error) return errorResponse("delete", error)
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

  if (error) return errorResponse("patch", error)
  return NextResponse.json(article)
}
