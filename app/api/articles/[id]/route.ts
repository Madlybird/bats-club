import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { isUuid } from "@/lib/sanitize"

function revalidateArticle(id: string, slug?: string | null) {
  revalidatePath("/articles")
  revalidatePath("/ru/articles")
  revalidatePath("/jp/articles")
  const identifier = slug || id
  revalidatePath(`/articles/${identifier}`)
  revalidatePath(`/ru/articles/${identifier}`)
  revalidatePath(`/jp/articles/${identifier}`)
  // Slug and id resolve to different cache entries (generateStaticParams-less
  // dynamicParams route can be hit via either) — cover both concrete paths
  // instead of invalidating the whole dynamic route template, which would
  // regenerate every other article page too. Same fix as figures/[id].
  if (slug && slug !== id) {
    revalidatePath(`/articles/${id}`)
    revalidatePath(`/ru/articles/${id}`)
    revalidatePath(`/jp/articles/${id}`)
  }
}

function errorResponse(stage: string, error: any, status = 500) {
  // Log full Postgres detail server-side; return only a generic message
  // to the client so we don't leak schema / column names / hints.
  console.error(`[articles/id] ${stage} failed`, {
    message: error?.message,
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
  })
  return NextResponse.json({ error: "Request failed", stage }, { status })
}

export async function GET(_req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  // Look up by id OR slug, but via the safe `.eq()` builder (not raw
  // `.or()` string interpolation, which is injectable). UUIDs go to id,
  // everything else to slug.
  const column = isUuid(params.id) ? "id" : "slug"

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
    .eq(column, params.id)
    .single()

  if (error || !article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // Unpublished drafts are admin-only. Don't expose them by id/slug.
  if (!article.published) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
  }

  return NextResponse.json({
    ...article,
    articleFigures: (article.article_figures || []).map((af: any) => ({ figure: af.figure })),
  })
}

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
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

    revalidateArticle(params.id, (fullArticle as any)?.slug)

    return NextResponse.json({
      ...fullArticle,
      articleFigures: ((fullArticle as any)?.article_figures || []).map((af: any) => ({ figure: af.figure })),
    })
  } catch (error: any) {
    return errorResponse(stage, error)
  }
}

export async function DELETE(_req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { data: existing } = await supabaseAdmin
    .from("articles")
    .select("slug")
    .eq("id", params.id)
    .maybeSingle()

  const { error } = await supabaseAdmin.from("articles").delete().eq("id", params.id)
  if (error) return errorResponse("delete", error)

  revalidateArticle(params.id, existing?.slug)

  return NextResponse.json({ success: true })
}

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
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

  revalidateArticle(params.id, article?.slug)

  return NextResponse.json(article)
}
