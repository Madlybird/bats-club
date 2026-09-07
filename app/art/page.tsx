import { Suspense } from "react"
import type { Metadata } from "next"
import { getArtForList } from "@/lib/art"
import { ART_I18N } from "@/lib/art-i18n"
import { en } from "@/lib/dict"
import ArtPageContent from "@/components/ArtPageContent"
import { buildCollectionPageJsonLd } from "@/lib/collection-jsonld"

const s = ART_I18N.en

// Count + stock badges must always match the DB (no ISR window) — same
// rationale as /shop. force-dynamic + force-no-store: a fixed-shape query
// otherwise sticks in the Next Data Cache.
export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: s.page_title,
    description: s.page_desc,
    alternates: {
      canonical: "https://batsclub.com/art",
      languages: {
        en: "https://batsclub.com/art",
        ru: "https://batsclub.com/ru/art",
        ja: "https://batsclub.com/jp/art",
        "x-default": "https://batsclub.com/art",
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

export default async function ArtPage() {
  const items = await getArtForList()

  const jsonLd = buildCollectionPageJsonLd({
    name: "Bats Club Art",
    description: s.page_desc,
    url: "https://batsclub.com/art",
    numberOfItems: items.length,
  })

  const ageGateLabels = {
    badge: en.age_gate_badge,
    title: en.age_gate_title,
    body: en.age_gate_body,
    confirm: en.age_gate_confirm,
    deny: en.age_gate_deny,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Suspense fallback={<Skeleton />}>
        <ArtPageContent items={items} strings={s} basePath="/art" ageGateLabels={ageGateLabels} />
      </Suspense>
    </>
  )
}
