import { supabaseAdmin } from "@/lib/supabase"
import ArticlesPageContent from "@/components/ArticlesPageContent"
import { en } from "@/lib/dict"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Articles | Bats Club",
  description: "Collector spotlights, reviews, and news from the Bats Club community.",
}

export const revalidate = 60

export default async function ArticlesPage() {
  const { data: articles } = await supabaseAdmin
    .from("articles")
    .select(`
      id, title, slug, excerpt, published,
      coverImage:cover_image, createdAt:created_at,
      author:users(id, name, username, avatar),
      article_figures(id)
    `)
    .eq("published", true)
    .order("created_at", { ascending: false })

  const result = (articles || []).map((a) => ({
    ...a,
    _count: { articleFigures: (a.article_figures || []).length },
  }))

  return <ArticlesPageContent articles={result as any} dict={en} />
}
