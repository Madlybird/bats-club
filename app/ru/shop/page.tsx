import { Suspense } from "react"
import type { Metadata } from "next"
import ShopPageContent from "@/components/ShopPageContent"
import { ru } from "@/lib/dict"
import { buildCollectionPageJsonLd } from "@/lib/collection-jsonld"
import { getShopPageData } from "@/lib/shop-catalog"

export const metadata: Metadata = {
  title: "Купить редкие аниме-фигурки",
  description:
    "Магазин подлинных винтажных аниме-фигурок из частной японской коллекции. Доставка по миру. Все фигурки проверены и описаны.",
  alternates: {
    canonical: "https://batsclub.com/ru/shop",
    languages: {
      en: "https://batsclub.com/shop",
      ru: "https://batsclub.com/ru/shop",
      ja: "https://batsclub.com/jp/shop",
      "x-default": "https://batsclub.com/shop",
    },
  },
}

// Renders per request (reads searchParams), but the catalog itself comes
// from a tagged cache — see lib/shop-catalog.ts for invalidation.

function ShopSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-2xl border border-white/[0.06] animate-pulse"
            style={{ background: "rgba(255,255,255,0.02)" }}
          />
        ))}
      </div>
    </div>
  )
}

interface Props { searchParams: Promise<{ price?: string; sort?: string; series?: string; collection?: string }> }


export default async function ShopPageRu(props: Props) {
  const searchParams = await props.searchParams;
  const { price, sort, series, collection } = searchParams
  const { listings: filtered, topSeries, topCollections } = await getShopPageData("ru", { price, sort, series, collection })
  const collectionJsonLd = buildCollectionPageJsonLd({
    name: "Bats Club Shop",
    description: "Shop authentic vintage anime figures from a private Japanese collection.",
    url: "https://batsclub.com/ru/shop",
    numberOfItems: filtered.length,
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd).replace(/</g, "\\u003c") }}
      />
      <Suspense fallback={<ShopSkeleton />}>
        <ShopPageContent
          listings={filtered as any}
          priceRange={price}
          sort={sort}
          series={series}
          topSeries={topSeries}
          collection={collection}
          topCollections={topCollections}
          dict={ru}
          shopBasePath="/ru/shop"
        />
      </Suspense>
    </>
  )
}
