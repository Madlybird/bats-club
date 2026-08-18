import { supabaseAdmin } from "@/lib/supabase"
import { notFound } from "next/navigation"
import ArticleDetailContent from "@/components/ArticleDetailContent"
import { buildArticleJsonLd } from "@/lib/article-jsonld"
import { en } from "@/lib/dict"
import { Metadata } from "next"

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { data: article } = await supabaseAdmin
    .from("articles")
    .select("title, excerpt, slug, cover_image")
    .or(`slug.eq.${params.id},id.eq.${params.id}`)
    .eq("published", true)
    .single()
  if (!article) return { title: "Article Not Found" }
  const canonical = `https://batsclub.com/articles/${params.id}`
  const slug = article.slug || params.id
  return {
    title: `${article.title} | Bats Club`,
    description: article.excerpt || undefined,
    alternates: {
      canonical,
      languages: {
        en: `https://batsclub.com/articles/${slug}`,
        ru: `https://batsclub.com/ru/articles/${slug}`,
        ja: `https://batsclub.com/jp/articles/${slug}`,
        "x-default": `https://batsclub.com/articles/${slug}`,
      },
    },
    openGraph: {
      title: article.title,
      description: article.excerpt || undefined,
      url: canonical,
      type: "article",
      images: article.cover_image ? [{ url: article.cover_image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt || undefined,
      images: article.cover_image ? [article.cover_image] : undefined,
    },
  }
}

export default async function ArticleDetailPage(props: Props) {
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

  return (
    <ArticleDetailContent
      article={{
        ...(article as any),
        articleFigures: (article.article_figures || []).map((af: any) => ({ figure: af.figure })),
      }}
      dict={en}
      articlesHref="/articles"
      jsonLd={buildArticleJsonLd(article as any, "")}
    />
  )
}
