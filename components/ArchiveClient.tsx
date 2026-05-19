"use client"

import { useState, useMemo } from "react"
import FigureCard from "./FigureCard"

interface CheapestListing {
  id: string
  price: number
  condition: string
}

interface FigureData {
  id: string
  name: string
  series: string
  character: string
  manufacturer: string
  scale: string
  year: number
  imageUrl?: string | null
  wishlistCount: number
  userStatus?: string | null
  _count: { listings: number }
  cheapestListing?: CheapestListing | null
}

interface Labels {
  collectionsHeading: string
  searchPh: string
  characterLabel: string
  mfgLabel: string
  resultsWord: string
  clearFilters: string
  emptyTitle: string
  emptySub: string
  clearAllBtn: string
  popularSeries?: string
  figurePath?: string
  forSale?: string
  wishlisting?: string
  noImage?: string
  statusHave?: string
  statusWishlist?: string
  statusBuy?: string
  toastAddedWishlist?: string
  toastAddedWishlistCart?: string
}

interface ArchiveClientProps {
  figures: FigureData[]
  characters?: string[]
  manufacturers?: string[]
  seriesCounts?: { name: string; count: number }[]
  defaultSeries?: string | null
  labels: Labels
}

const PILL_CLS =
  "flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all duration-200 font-medium"
const PILL_INACTIVE =
  "bg-[#0a0a12] border-[#1a1a3a] text-slate-400 hover:border-[#ff2d78]/50 hover:text-slate-200"
const PILL_ACTIVE = "bg-[#ff2d78] border-[#ff2d78] text-white"

// How many series to surface as "popular".
const POPULAR_LIMIT = 16

export default function ArchiveClient({
  figures,
  seriesCounts = [],
  defaultSeries = null,
  labels,
}: ArchiveClientProps) {
  const [search, setSearch] = useState("")
  const [selectedSeries, setSelectedSeries] = useState<string | null>(
    defaultSeries
  )

  const popularSeries = useMemo(
    () => seriesCounts.slice(0, POPULAR_LIMIT),
    [seriesCounts]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return figures.filter((f) => {
      const matchesSearch =
        !q ||
        f.name.toLowerCase().includes(q) ||
        f.character.toLowerCase().includes(q) ||
        f.series.toLowerCase().includes(q) ||
        f.manufacturer.toLowerCase().includes(q)
      const matchesSeries = !selectedSeries || f.series === selectedSeries
      return matchesSearch && matchesSeries
    })
  }, [figures, search, selectedSeries])

  const clearFilters = () => {
    setSearch("")
    setSelectedSeries(null)
  }

  const hasFilters = !!search || !!selectedSeries

  return (
    <div>
      <div className="mb-8 space-y-5">
        {/* Search */}
        <div className="relative">
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
            placeholder={labels.searchPh}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 text-sm"
          />
        </div>

        {/* Popular series */}
        {popularSeries.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">
              {labels.popularSeries || "popular series"}
            </p>
            <div
              className="flex md:flex-wrap gap-2 overflow-x-auto md:overflow-visible scrollbar-none pb-1 -mx-4 px-4 md:mx-0 md:px-0"
              style={{ scrollbarWidth: "none" }}
            >
              {popularSeries.map((s) => (
                <button
                  key={s.name}
                  onClick={() =>
                    setSelectedSeries(
                      selectedSeries === s.name ? null : s.name
                    )
                  }
                  className={`${PILL_CLS} ${
                    selectedSeries === s.name ? PILL_ACTIVE : PILL_INACTIVE
                  }`}
                >
                  {s.name}
                  <span className="ml-1.5 opacity-50">{s.count}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results count + clear */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            <span className="font-semibold" style={{ color: "#ff2d78" }}>
              {filtered.length}
            </span>{" "}
            {labels.resultsWord}
          </p>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-slate-500 hover:text-[#ff2d78] transition-colors"
            >
              {labels.clearFilters}
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((figure, index) => (
            <FigureCard
              key={figure.id}
              figure={figure}
              priority={index < 4}
              labels={{
                figurePath: labels.figurePath ?? "",
                forSale: labels.forSale ?? "",
                wishlisting: labels.wishlisting ?? "",
                noImage: labels.noImage ?? "",
                statusHave: labels.statusHave ?? "",
                statusWishlist: labels.statusWishlist ?? "",
                statusBuy: labels.statusBuy ?? "",
                toastAddedWishlist: labels.toastAddedWishlist ?? "",
                toastAddedWishlistCart: labels.toastAddedWishlistCart ?? "",
              }}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="text-5xl mb-4 opacity-30">🦇</span>
          <p className="text-white/40 text-lg font-medium">
            {labels.emptyTitle}
          </p>
          <p className="text-white/20 text-sm mt-1">{labels.emptySub}</p>
          <button onClick={clearFilters} className="btn-ghost mt-4 text-sm">
            {labels.clearAllBtn}
          </button>
        </div>
      )}
    </div>
  )
}
