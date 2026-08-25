import { supabaseAdmin } from "@/lib/supabase"
import { notFound } from "next/navigation"
import ArticleDetailContent from "@/components/ArticleDetailContent"
import { buildArticleJsonLd } from "@/lib/article-jsonld"
import { ru } from "@/lib/dict"
import { localizeArticle } from "@/lib/articleI18n"
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
  const a = localizeArticle(article as any, "ru")
  const canonical = `https://batsclub.com/ru/articles/${params.id}`
  const slug = article.slug || params.id
  return {
    title: `${a.title}`,
    description: a.excerpt || undefined,
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
      title: a.title,
      description: a.excerpt || undefined,
      url: canonical,
      type: "article",
      images: article.cover_image ? [{ url: article.cover_image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: a.title,
      description: a.excerpt || undefined,
      images: article.cover_image ? [article.cover_image] : undefined,
    },
  }
}

export default async function ArticleDetailPageRu(props: Props) {
  const params = await props.params;
  const { data: article } = await supabaseAdmin
    .from("articles")
    .select(`
      id, title, slug, body, excerpt, published,
      coverImage:cover_image, authorId:author_id,
      createdAt:created_at, updatedAt:updated_at,
      author:users(id, name, username, avatar, bio),
      article_figures(figure:figures(id, slug, name, series, character, scale, manufacturer, imageUrl:image_url))
    `)
    .or(`slug.eq.${params.id},id.eq.${params.id}`)
    .eq("published", true)
    .single()

  if (!article) notFound()

  const localized = localizeArticle(article as any, "ru")

  return (
    <ArticleDetailContent
      article={{
        ...(localized as any),
        articleFigures: (article.article_figures || []).map((af: any) => ({ figure: af.figure })),
      }}
      dict={ru}
      articlesHref="/ru/articles"
      jsonLd={buildArticleJsonLd({ ...(article as any), ...localized }, "ru")}
    />
  )
}
