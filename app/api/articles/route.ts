import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const all = searchParams.get("all") === "true"

  const session = await getServerSession(authOptions)
  const isAdmin = session?.user?.isAdmin

  let query = supabaseAdmin
    .from("articles")
    .select(`
      id, title, slug, body, excerpt, published,
      coverImage:cover_image, authorId:author_id,
      createdAt:created_at, updatedAt:updated_at,
      author:users(id, name, username, avatar),
      article_figures(
        figure:figures(id, name, imageUrl:image_url)
      )
    `)
    .order("created_at", { ascending: false })

  if (!(all && isAdmin)) {
    query = query.eq("published", true)
  }

  const { data: articles, error } = await query

  if (error) {
    console.error("Get articles error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }

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

  try {
    const { title, slug, body, excerpt, coverImage, figureIds, published } = await req.json()

    if (!title || !body) {
      return NextResponse.json({ error: "Title and body are required" }, { status: 400 })
    }

    const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

    const { data: existing } = await supabaseAdmin
      .from("articles")
      .select("id")
      .eq("slug", finalSlug)
      .single()

    if (existing) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 })
    }

    const { data: article, error } = await supabaseAdmin
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
      .select("id, title, slug, body, excerpt, published, coverImage:cover_image, authorId:author_id, createdAt:created_at")
      .single()

    if (error) throw error

    // Link figures
    if (figureIds?.length) {
      await supabaseAdmin.from("article_figures").insert(
        figureIds.map((fid: string) => ({ article_id: article.id, figure_id: fid }))
      )
    }

    // Fetch full article with relations
    const { data: fullArticle } = await supabaseAdmin
      .from("articles")
      .select(`
        id, title, slug, published, coverImage:cover_image, createdAt:created_at,
        author:users(name, username),
        article_figures(figure:figures(name))
      `)
      .eq("id", article.id)
      .single()

    return NextResponse.json(
      {
        ...fullArticle,
        articleFigures: ((fullArticle as any)?.article_figures || []).map((af: any) => ({ figure: af.figure })),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Create article error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
