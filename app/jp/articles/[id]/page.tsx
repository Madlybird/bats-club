import { supabaseAdmin } from "@/lib/supabase"
import { notFound } from "next/navigation"
import ArticleDetailContent from "@/components/ArticleDetailContent"
import { jp } from "@/lib/dict"
import { localizeArticle } from "@/lib/articleI18n"
import { Metadata } from "next"

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { data: article } = await supabaseAdmin
    .from("articles")
    .select("title, excerpt, slug")
    .or(`slug.eq.${params.id},id.eq.${params.id}`)
    .eq("published", true)
    .single()
  if (!article) return { title: "Article Not Found" }
  const a = localizeArticle(article as any, "jp")
  const canonical = `https://batsclub.com/jp/articles/${params.id}`
  return {
    title: `${a.title} | Bats Club`,
    description: a.excerpt || undefined,
    alternates: { canonical },
  }
}

export default async function ArticleDetailPageJp(props: Props) {
  const params = await props.params;
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

  const localized = localizeArticle(article as any, "jp")

  return (
    <ArticleDetailContent
      article={{
        ...(localized as any),
        articleFigures: (article.article_figures || []).map((af: any) => ({ figure: af.figure })),
      }}
      dict={jp}
      articlesHref="/jp/articles"
    />
  )
}
