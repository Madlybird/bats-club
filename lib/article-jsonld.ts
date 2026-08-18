const BASE = "https://batsclub.com"

interface ArticleForJsonLd {
  title: string
  excerpt?: string | null
  coverImage?: string | null
  slug: string
  createdAt?: string | Date | null
  updatedAt?: string | Date | null
  author?: { name?: string | null; username?: string | null } | null
}

// BlogPosting rather than NewsArticle — this is evergreen collector
// reference content, not time-sensitive reporting, and BlogPosting is
// the schema.org type Google's own docs point to for that case.
export function buildArticleJsonLd(article: ArticleForJsonLd, localePrefix: string) {
  const path = localePrefix ? `/${localePrefix}/articles/${article.slug}` : `/articles/${article.slug}`
  const url = `${BASE}${path}`

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.excerpt || undefined,
    image: article.coverImage ? [article.coverImage] : undefined,
    datePublished: article.createdAt ? new Date(article.createdAt).toISOString() : undefined,
    dateModified: article.updatedAt ? new Date(article.updatedAt).toISOString() : undefined,
    author: {
      "@type": "Person",
      name: article.author?.name || article.author?.username || "Bats Club",
    },
    publisher: {
      "@type": "Organization",
      name: "Bats Club",
      logo: { "@type": "ImageObject", url: `${BASE}/logo.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
  }
}
