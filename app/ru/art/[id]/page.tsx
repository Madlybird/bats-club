import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getArtItem, getRecentArtListingIds } from "@/lib/art"
import { ART_I18N } from "@/lib/art-i18n"
import { ru } from "@/lib/dict"
import ArtDetail from "@/components/ArtDetail"
import { artListingMetadata } from "@/lib/product-metadata"
import { buildBreadcrumbJsonLd } from "@/lib/breadcrumb-jsonld"

const s = ART_I18N.ru

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
  const title = `${item.title} — ${item.type} · ${item.artist}`
  return {
    title,
    description: `${item.title}${item.series ? ` · ${item.series}` : ""}. ${item.type}, ${item.size}. Оригинальный арт ${item.artist}. Доставка по миру.`,
    ...artListingMetadata(id, "ru", title, item.coverImage),
  }
}

export default async function ArtListingPageRu(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const item = await getArtItem(id)
  if (!item) notFound()

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Bats Club", url: "https://batsclub.com/ru" },
    { name: s.breadcrumb, url: "https://batsclub.com/ru/art" },
    { name: item.title, url: `https://batsclub.com/ru/art/${item.id}` },
  ])

  const ageGateLabels = {
    badge: ru.age_gate_badge,
    title: ru.age_gate_title,
    body: ru.age_gate_body,
    confirm: ru.age_gate_confirm,
    deny: ru.age_gate_deny,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c") }} />
      <ArtDetail
        item={item}
        strings={s}
        description={item.descriptionRu || item.description}
        basePath="/ru/art"
        cartHref="/ru/cart"
        shareLabel={ru.share_label}
        ageGateLabels={ageGateLabels}
      />
    </>
  )
}
