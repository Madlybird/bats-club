import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getBookItem, getRecentBookListingIds, getSameSeriesBooks } from "@/lib/books"
import { BOOKS_I18N } from "@/lib/books-i18n"
import { jp } from "@/lib/dict"
import BookDetail from "@/components/BookDetail"
import { bookListingMetadata } from "@/lib/product-metadata"
import { buildBreadcrumbJsonLd } from "@/lib/breadcrumb-jsonld"

const s = BOOKS_I18N.jp

// Mirrors /art/[id]: bounded static params + on-demand for the long tail,
// revalidated from the bot with a 1h fallback window.
export const dynamicParams = true
export const revalidate = 3600

export async function generateStaticParams(): Promise<{ id: string }[]> {
  const ids = await getRecentBookListingIds(100)
  return ids.map((id) => ({ id }))
}

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await props.params
  const item = await getBookItem(id)
  if (!item) return { title: "Book Not Found" }
  const title = `${item.title}${item.author ? ` — ${item.author}` : ""} (${item.type})`
  const bits = [item.type, item.publisher, item.year ? String(item.year) : null, s.condition_names[item.condition] ?? item.condition]
    .filter(Boolean).join(", ")
  return {
    title,
    description: `${item.title}${item.series ? ` · ${item.series}` : ""}. ${bits}. 世界発送対応。`,
    ...bookListingMetadata(id, "jp", title, item.coverImage),
  }
}

const CONDITION_SCHEMA: Record<string, string> = {
  New: "https://schema.org/NewCondition",
}

export default async function BooksPageJpItem(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const item = await getBookItem(id)
  if (!item) notFound()
  const related = item.series ? await getSameSeriesBooks(item.series, item.id) : []

  const url = `https://batsclub.com/jp/books/${item.id}`
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Bats Club", url: "https://batsclub.com/jp/" },
    { name: s.breadcrumb, url: "https://batsclub.com/jp/books" },
    { name: item.title, url },
  ])
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": ["Product", "Book"],
    name: item.title,
    ...(item.author ? { author: { "@type": "Person", name: item.author } } : {}),
    ...(item.publisher ? { publisher: { "@type": "Organization", name: item.publisher } } : {}),
    ...(item.isbn ? { isbn: item.isbn } : {}),
    ...(item.pages ? { numberOfPages: item.pages } : {}),
    ...(item.language ? { inLanguage: item.language } : {}),
    image: item.photos.slice(0, 5),
    description: item.description || item.title,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "USD",
      price: (item.price / 100).toFixed(2),
      availability: item.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      itemCondition: CONDITION_SCHEMA[item.condition] ?? "https://schema.org/UsedCondition",
    },
  }

  const ageGateLabels = {
    badge: jp.age_gate_badge,
    title: jp.age_gate_title,
    body: jp.age_gate_body,
    confirm: jp.age_gate_confirm,
    deny: jp.age_gate_deny,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\u003c") }} />
      {!item.isMature && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd).replace(/</g, "\u003c") }} />
      )}
      <BookDetail
        item={item}
        related={related}
        strings={s}
        description={item.descriptionJp || item.description}
        basePath="/jp/books"
        cartHref="/jp/cart"
        shareLabel={jp.share_label}
        ageGateLabels={ageGateLabels}
      />
    </>
  )
}
