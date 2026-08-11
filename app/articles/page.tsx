import { supabaseAdmin } from "@/lib/supabase"
import ArticlesPageContent from "@/components/ArticlesPageContent"
import { en } from "@/lib/dict"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Collector Articles & Spotlights | Bats Club",
  description:
    "Anime figure collecting guides, reviews and collector spotlights from Bats Club.",
  alternates: {
    canonical: "https://batsclub.com/articles",
    languages: {
      en: "https://batsclub.com/articles",
      ru: "https://batsclub.com/ru/articles",
      ja: "https://batsclub.com/jp/articles",
      "x-default": "https://batsclub.com/articles",
    },
  },
}

// Article create/publish/edit/delete all call revalidatePath("/articles",
// ...) directly (see app/api/articles/route.ts and [id]/route.ts) — this
// window is just a fallback for the rare case on-demand revalidation
// doesn't fire, same reasoning as shop/[id].
export const revalidate = 3600

export default async function ArticlesPage() {
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
    ...a,
    _count: { articleFigures: (a.article_figures || []).length },
  }))

  return <ArticlesPageContent articles={result as any} dict={en} />
}
