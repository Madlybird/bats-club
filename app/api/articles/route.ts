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
  console.error(`[articles] ${stage} failed`, payload)
  return NextResponse.json(payload, { status })
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const all = searchParams.get("all") === "true"

  const session = await getServerSession(authOptions)
  const isAdmin = session?.user?.isAdmin

  let query = supabaseAdmin
    .from("articles")
    .select(`
      id, title, slug, body, excerpt, published, pinned,
      coverImage:cover_image, authorId:author_id,
      createdAt:created_at, updatedAt:updated_at,
      author:users(id, name, username, avatar),
      article_figures(
        figure:figures(id, name, imageUrl:image_url)
      )
    `)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })

  if (!(all && isAdmin)) {
    query = query.eq("published", true)
  }

  const { data: articles, error } = await query
  if (error) return errorResponse("list", error)

  const result = (articles || []).map((a) => ({
    ...a,
    articleFigures: (a.article_figures || []).map((af: any) => ({ figure: af.figure })),
    _count: { articleFigures: (a.article_figures || []).length },
  }))

  return NextResponse.json(result)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let stage = "parse-body"
  try {
    const { title, slug, body, excerpt, coverImage, figureIds, published } = await req.json()

    if (!title || !body) {
      return NextResponse.json({ error: "Title and body are required" }, { status: 400 })
    }

    const finalSlug =
      (slug && String(slug).trim()) ||
      title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

    stage = "check-slug"
    const { data: existing, error: slugError } = await supabaseAdmin
      .from("articles")
      .select("id")
      .eq("slug", finalSlug)
      .maybeSingle()
    if (slugError) return errorResponse(stage, slugError)
    if (existing) {
      return NextResponse.json({ error: "Slug already exists", stage }, { status: 409 })
    }

    stage = "insert"
    const { data: article, error: insertError } = await supabaseAdmin
      .from("articles")
      .insert({
        title,
        slug: finalSlug,
        body,
        excerpt: excerpt || null,
        cover_image: coverImage || null,
        author_id: session.user.id,
        published: published || false,
      })
      .select("id")
      .single()
    if (insertError || !article) return errorResponse(stage, insertError || new Error("insert returned no row"))

    if (figureIds?.length) {
      stage = "link-figures"
      const { error: linkError } = await supabaseAdmin
        .from("article_figures")
        .insert(figureIds.map((fid: string) => ({ article_id: article.id, figure_id: fid })))
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
      .eq("id", article.id)
      .single()
    if (fetchError) return errorResponse(stage, fetchError)

    return NextResponse.json(
      {
        ...fullArticle,
        articleFigures: ((fullArticle as any)?.article_figures || []).map((af: any) => ({ figure: af.figure })),
      },
      { status: 201 }
    )
  } catch (error: any) {
    return errorResponse(stage, error)
  }
}
