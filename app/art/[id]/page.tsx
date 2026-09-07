import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getArtItem, getRecentArtListingIds } from "@/lib/art"
import { ART_I18N } from "@/lib/art-i18n"
import { en } from "@/lib/dict"
import ArtDetail from "@/components/ArtDetail"
import { artListingMetadata } from "@/lib/product-metadata"
import { buildBreadcrumbJsonLd } from "@/lib/breadcrumb-jsonld"

const s = ART_I18N.en

// Mirrors app/shop/[id]: bounded generateStaticParams + dynamicParams for the
// long tail, on-demand revalidation from the bot with a 1h fallback window.
export const dynamicParams = true
export const revalidate = 3600

export async function generateStaticParams(): Promise<{ id: string }[]> {
  const ids = await getRecentArtListingIds(100)
  return ids.map((id) => ({ id }))
}

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await props.params
  const item = await getArtItem(id)
  if (!item) return { title: "Art Not Found" }
  const title = `${item.title} — ${item.type} by ${item.artist}`
  return {
    title,
    description: `${item.title}${item.series ? ` · ${item.series}` : ""}. ${item.type}, ${item.size}. Original art by ${item.artist}. Ships worldwide from Bats Club.`,
    ...artListingMetadata(id, "", title, item.coverImage),
  }
}

export default async function ArtListingPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const item = await getArtItem(id)
  if (!item) notFound()

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Bats Club", url: "https://batsclub.com/" },
    { name: s.breadcrumb, url: "https://batsclub.com/art" },
    { name: item.title, url: `https://batsclub.com/art/${item.id}` },
  ])

  const ageGateLabels = {
    badge: en.age_gate_badge,
    title: en.age_gate_title,
    body: en.age_gate_body,
    confirm: en.age_gate_confirm,
    deny: en.age_gate_deny,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c") }} />
      <ArtDetail
        item={item}
        strings={s}
        description={item.description}
        basePath="/art"
        cartHref="/cart"
        shareLabel={en.share_label}
        ageGateLabels={ageGateLabels}
      />
    </>
  )
}
