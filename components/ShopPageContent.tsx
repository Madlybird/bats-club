"use client"

import { useMemo, useState } from "react"
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
    isMature?: boolean | null
    scale: string
  }
}

interface TopSeries {
  series: string
  count: number
}

interface Props {
  listings: Listing[]
  priceRange?: string
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

export default function ShopPageContent({ listings, priceRange, sort, series, topSeries, dict, shopBasePath = "/shop" }: Props) {
  const listingLabels = {
    addToCart: dict.shop_add_to_cart,
    alreadyInCart: dict.shop_already_in_cart,
  }

  const ageGateLabels = {
    badge: dict.age_gate_badge,
    title: dict.age_gate_title,
    body: dict.age_gate_body,
    confirm: dict.age_gate_confirm,
    deny: dict.age_gate_deny,
  }

  const [search, setSearch] = useState("")

  const filteredListings = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return listings
    return listings.filter(
      (l) =>
        l.figure.name.toLowerCase().includes(q) ||
        l.figure.character.toLowerCase().includes(q) ||
        l.figure.series.toLowerCase().includes(q)
    )
  }, [listings, search])

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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              <span className="inline-block w-8 h-px bg-[#ff2d78] mb-4" />
              <h1
                className="font-black lowercase leading-tight tracking-tighter text-white"
                style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)" }}
              >
                {dict.shop_heading}
              </h1>
              <p className="text-white/35 mt-2 text-sm font-medium">
                {listings.length} {dict.shop_listings_suffix}
              </p>
            </div>
          </div>
        </ScrollReveal>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <ScrollReveal>
            <SeriesBar topSeries={topSeries} currentSeries={series} dict={dict} />

            {/* Search */}
            <div className="relative mb-5">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder={dict.shop_search_ph}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10 text-base sm:text-sm"
              />
            </div>

            <ShopFilters currentPriceRange={priceRange} currentSort={sort} currentSeries={series} dict={dict} />

            {search && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-slate-500">
                  <span className="font-semibold" style={{ color: "#ff2d78" }}>
                    {filteredListings.length}
                  </span>{" "}
                  {dict.shop_results}
                </p>
                <button
                  onClick={() => setSearch("")}
                  className="text-xs text-slate-500 hover:text-[#ff2d78] transition-colors"
                >
                  {dict.shop_clear_search}
                </button>
              </div>
            )}
          </ScrollReveal>

          {filteredListings.length > 0 ? (
            <ScrollReveal>
              <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-stretch">
                {filteredListings.map((listing, index) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    labels={listingLabels}
                    ageGateLabels={ageGateLabels}
                    basePath={shopBasePath}
                    priority={index < 4}
                  />
                ))}
              </div>
            </ScrollReveal>
          ) : (
            <ScrollReveal>
              <div className="mt-16 flex flex-col items-center justify-center text-center py-16">
                <span className="text-5xl mb-4 opacity-30">🦇</span>
                <p className="text-white/40 text-lg font-medium">{dict.shop_empty_title}</p>
                <p className="text-white/20 text-sm mt-1">{dict.shop_empty_sub}</p>
                {search && (
                  <button onClick={() => setSearch("")} className="btn-ghost mt-4 text-sm">
                    {dict.shop_clear_search}
                  </button>
                )}
              </div>
            </ScrollReveal>
          )}
        </div>
      </div>
    </div>
  )
}
