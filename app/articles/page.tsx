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
  // `pinned` may not exist yet on every environment (added via a schema
  // migration run separately from deploys) — try the pinned-aware query
  // first and fall back to the plain one so this page never hard-fails
  // if the column is momentarily missing.
  let articles
  const withPinned = await supabaseAdmin
    .from("articles")
    .select(`
      id, title, slug, excerpt, published, pinned,
      coverImage:cover_image, createdAt:created_at,
      author:users(id, name, username, avatar),
      article_figures(figure_id)
    `)
    .eq("published", true)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })

  if (withPinned.error) {
    const fallback = await supabaseAdmin
      .from("articles")
      .select(`
        id, title, slug, excerpt, published,
        coverImage:cover_image, createdAt:created_at,
        author:users(id, name, username, avatar),
        article_figures(figure_id)
      `)
      .eq("published", true)
      .order("created_at", { ascending: false })
    articles = fallback.data
  } else {
    articles = withPinned.data
  }

  const result = (articles || []).map((a) => ({
    ...a,
    _count: { articleFigures: (a.article_figures || []).length },
  }))

  return <ArticlesPageContent articles={result as any} dict={en} />
}
