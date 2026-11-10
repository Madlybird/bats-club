import { Suspense } from "react"
import type { Metadata } from "next"
import { getBooksForList } from "@/lib/books"
import { BOOKS_I18N } from "@/lib/books-i18n"
import { jp } from "@/lib/dict"
import BooksPageContent from "@/components/BooksPageContent"
import { buildCollectionPageJsonLd } from "@/lib/collection-jsonld"

const s = BOOKS_I18N.jp

// Counts + sold badges must match the DB (same rationale as /art and /shop).
export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: s.page_title,
    description: s.page_desc,
    alternates: {
      canonical: "https://batsclub.com/jp/books",
      languages: {
        en: "https://batsclub.com/books",
        ru: "https://batsclub.com/ru/books",
        ja: "https://batsclub.com/jp/books",
        "x-default": "https://batsclub.com/books",
      },
    },
  }
}

function Skeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/[0.06] animate-pulse" style={{ aspectRatio: "3 / 4", background: "rgba(255,255,255,0.02)" }} />
        ))}
      </div>
    </div>
  )
}

export default async function BooksPageJp() {
  const items = await getBooksForList()

  const jsonLd = buildCollectionPageJsonLd({
    name: "Bats Club Books",
    description: s.page_desc,
    url: "https://batsclub.com/jp/books",
    numberOfItems: items.length,
  })

  const ageGateLabels = {
    badge: jp.age_gate_badge,
    title: jp.age_gate_title,
    body: jp.age_gate_body,
    confirm: jp.age_gate_confirm,
    deny: jp.age_gate_deny,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\u003c") }} />
      <Suspense fallback={<Skeleton />}>
        <BooksPageContent items={items} strings={s} basePath="/jp/books" ageGateLabels={ageGateLabels} />
      </Suspense>
    </>
  )
}
