"use client"

import { useRouter, usePathname } from "next/navigation"
import ListingCard from "@/components/ListingCard"
import ShopFilters from "@/components/ShopFilters"
import BatsOverlay from "@/components/BatsOverlay"
import ScrollReveal from "@/components/ScrollReveal"
import type { Dict } from "@/lib/dict"

interface Listing {
  id: string
  price: number
  condition: string
  description?: string | null
  photos: string
  figure: {
    id: string
    name: string
    series: string
    character: string
    imageUrl?: string | null
    scale: string
  }
}

interface TopSeries {
  series: string
  count: number
}

interface Props {
  listings: Listing[]
  condition?: string
  sort?: string
  series?: string
  topSeries: TopSeries[]
  dict: Dict
  shopBasePath?: string
}

function SeriesBar({ topSeries, currentSeries, dict }: { topSeries: TopSeries[]; currentSeries?: string; dict: Dict }) {
  const router = useRouter()
  const pathname = usePathname()

  if (topSeries.length === 0) return null

  const select = (s: string) => {
    const params = new URLSearchParams()
    if (currentSeries === s) {
      // deselect
    } else {
      params.set("series", s)
    }
    const q = params.toString()
    router.push(q ? `${pathname}?${q}` : pathname)
  }

  return (
    <div className="mb-6">
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">{dict.shop_popular_series}</p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {topSeries.map((s) => (
          <button
            key={s.series}
            onClick={() => select(s.series)}
            className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
              currentSeries === s.series
                ? "bg-[#ff2d78] border-[#ff2d78] text-white"
                : "bg-[#0a0a12] border-[#1a1a3a] text-slate-400 hover:border-[#ff2d78]/40 hover:text-white"
            }`}
          >
            <span className="truncate max-w-[120px]">{s.series}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${currentSeries === s.series ? "bg-white/20" : "bg-white/5"}`}>
              {s.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ShopPageContent({ listings, condition, sort, series, topSeries, dict, shopBasePath = "/shop" }: Props) {
  const listingLabels = {
    addToCart: dict.shop_add_to_cart,
    conditions: {
      Mint: dict.shop_condition_mint,
      "Near Mint": dict.shop_condition_near_mint,
      Good: dict.shop_condition_good,
      Fair: dict.shop_condition_fair,
      Poor: dict.shop_condition_poor,
    },
  }

  return (
    <div className="relative min-h-screen">
      <BatsOverlay />

      <div className="absolute top-1/4 right-1/3 w-[600px] h-[600px] rounded-full bg-[#ff2d78]/5 blur-[180px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-purple-900/6 blur-[120px] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative">
        <ScrollReveal>
          <div className="border-b border-white/[0.05]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
              <span className="inline-block w-8 h-px bg-[#ff2d78] mb-6" />
              <h1
                className="font-black lowercase leading-tight tracking-tighter text-white"
                style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
              >
                {dict.shop_heading}
              </h1>
              <p className="text-white/35 mt-3 text-base font-medium">
                {listings.length} {dict.shop_listings_suffix}
              </p>
            </div>
          </div>
        </ScrollReveal>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <ScrollReveal>
            <SeriesBar topSeries={topSeries} currentSeries={series} dict={dict} />
            <ShopFilters currentCondition={condition} currentSort={sort} currentSeries={series} dict={dict} />
          </ScrollReveal>

          {listings.length > 0 ? (
            <ScrollReveal>
              <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-stretch">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} labels={listingLabels} basePath={shopBasePath} />
                ))}
              </div>
            </ScrollReveal>
          ) : (
            <ScrollReveal>
              <div className="mt-16 flex flex-col items-center justify-center text-center py-16">
                <span className="text-5xl mb-4 opacity-30">🦇</span>
                <p className="text-white/40 text-lg font-medium">{dict.shop_empty_title}</p>
                <p className="text-white/20 text-sm mt-1">{dict.shop_empty_sub}</p>
              </div>
            </ScrollReveal>
          )}
        </div>
      </div>
    </div>
  )
}
