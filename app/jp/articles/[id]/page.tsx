import { supabaseAdmin } from "@/lib/supabase"
import { notFound } from "next/navigation"
import ArticleDetailContent from "@/components/ArticleDetailContent"
import { jp } from "@/lib/dict"
import { Metadata } from "next"

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: article } = await supabaseAdmin
    .from("articles")
    .select("title, excerpt")
    .or(`slug.eq.${params.id},id.eq.${params.id}`)
    .eq("published", true)
    .single()
  if (!article) return { title: "Article Not Found" }
  return {
    title: `${article.title} | Bats Club`,
    description: article.excerpt || undefined,
  }
}

export default async function ArticleDetailPageJp({ params }: Props) {
  const { data: article } = await supabaseAdmin
    .from("articles")
    .select(`
      id, title, slug, body, excerpt, published,
      coverImage:cover_image, authorId:author_id,
      createdAt:created_at, updatedAt:updated_at,
      author:users(id, name, username, avatar, bio),
      article_figures(figure:figures(id, name, series, character, scale, manufacturer, imageUrl:image_url))
    `)
    .or(`slug.eq.${params.id},id.eq.${params.id}`)
    .eq("published", true)
    .single()

  if (!article) notFound()

  return (
    <ArticleDetailContent
      article={{
        ...(article as any),
        articleFigures: (article.article_figures || []).map((af: any) => ({ figure: af.figure })),
      }}
      dict={jp}
      articlesHref="/articles"
    />
  )
}
