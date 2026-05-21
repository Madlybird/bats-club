import { supabaseAdmin } from "@/lib/supabase"
import ArticlesPageContent from "@/components/ArticlesPageContent"
import { jp } from "@/lib/dict"
import { localizeArticle } from "@/lib/articleI18n"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "コレクター記事・スポットライト | Bats Club",
  description:
    "Bats Clubによるアニメフィギュア収集ガイド、レビュー、コレクター紹介。",
}

export const revalidate = 60

export default async function ArticlesPageJp() {
  const { data: articles } = await supabaseAdmin
    .from("articles")
    .select(`
      id, title, slug, excerpt, published,
      coverImage:cover_image, createdAt:created_at,
      author:users(id, name, username, avatar),
      article_figures(figure_id)
    `)
    .eq("published", true)
    .order("created_at", { ascending: false })

  const result = (articles || []).map((a) => ({
    ...(localizeArticle(a as any, "jp") as any),
    _count: { articleFigures: (a.article_figures || []).length },
  }))

  return <ArticlesPageContent articles={result as any} dict={jp} articlesHref="/jp/articles" />
}
