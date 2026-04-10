"use client"

import { useState, useMemo, useRef } from "react"
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
  manufacturers: string[]
  seriesCounts?: { name: string; count: number }[]
  defaultSeries?: string | null
  labels: Labels
}

const PILL_CLS = "flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all duration-200 font-medium"
const PILL_INACTIVE = "bg-[#0a0a12] border-[#1a1a3a] text-slate-400 hover:border-[#ff2d78]/50 hover:text-slate-200"
const PILL_ACTIVE = "bg-[#ff2d78] border-[#ff2d78] text-white"

export default function ArchiveClient({
  figures,
  characters = [],
  manufacturers,
  labels,
}: ArchiveClientProps) {
  const [search, setSearch] = useState("")
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null)
  const [selectedManufacturer, setSelectedManufacturer] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir === "left" ? -240 : 240, behavior: "smooth" })
  }

  const filtered = useMemo(() => {
    return figures.filter((f) => {
      const matchesSearch =
        !search ||
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.character.toLowerCase().includes(search.toLowerCase()) ||
        f.series.toLowerCase().includes(search.toLowerCase()) ||
        f.manufacturer.toLowerCase().includes(search.toLowerCase())

      const matchesCharacter = !selectedCharacter || f.character === selectedCharacter
      const matchesMfg = !selectedManufacturer || f.manufacturer === selectedManufacturer

      return matchesSearch && matchesCharacter && matchesMfg
    })
  }, [figures, search, selectedCharacter, selectedManufacturer])

  const clearFilters = () => {
    setSearch("")
    setSelectedCharacter(null)
    setSelectedManufacturer(null)
  }

  const hasFilters = search || selectedCharacter || selectedManufacturer

  return (
    <div>
      {/* Search + Filters */}
      <div className="mb-8 space-y-4">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={labels.searchPh}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 text-sm"
          />
        </div>

        {/* Character chips — 2-row horizontal scroll */}
        {characters.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">{labels.characterLabel}</p>
            <div className="relative flex items-center gap-2">
              <button
                onClick={() => scroll("left")}
                className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full border border-[#1a1a3a] bg-[#0a0a12] text-slate-400 hover:text-[#ff2d78] hover:border-[#ff2d78]/50 transition-colors"
                aria-label="Scroll left"
              >
                ‹
              </button>

              {/* 2-row grid, horizontal scroll */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-x-auto scrollbar-none"
                style={{ scrollbarWidth: "none" }}
              >
                <div
                  className="grid gap-2"
                  style={{ gridTemplateRows: "repeat(2, auto)", gridAutoFlow: "column", gridAutoColumns: "max-content" }}
                >
                  {characters.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedCharacter(selectedCharacter === c ? null : c)}
                      className={`${PILL_CLS} ${selectedCharacter === c ? PILL_ACTIVE : PILL_INACTIVE}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => scroll("right")}
                className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full border border-[#1a1a3a] bg-[#0a0a12] text-slate-400 hover:text-[#ff2d78] hover:border-[#ff2d78]/50 transition-colors"
                aria-label="Scroll right"
              >
                ›
              </button>
            </div>
          </div>
        )}

        {/* Manufacturer chips — horizontal scroll on mobile, wrap on md+ */}
        <div>
          <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">{labels.mfgLabel}</p>
          <div
            className="flex md:flex-wrap gap-2 overflow-x-auto md:overflow-visible scrollbar-none pb-1 -mx-4 px-4 md:mx-0 md:px-0"
            style={{ scrollbarWidth: "none" }}
          >
            {manufacturers.map((m) => (
              <button
                key={m}
                onClick={() => setSelectedManufacturer(selectedManufacturer === m ? null : m)}
                className={`${PILL_CLS} ${selectedManufacturer === m ? PILL_ACTIVE : PILL_INACTIVE}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Results count + clear */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            <span className="font-semibold" style={{ color: "#ff2d78" }}>{filtered.length}</span>{" "}
            {labels.resultsWord}
          </p>
          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-[#ff2d78] transition-colors">
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
                figurePath: labels.figurePath ?? '',
                forSale: labels.forSale ?? '',
                wishlisting: labels.wishlisting ?? '',
                noImage: labels.noImage ?? '',
                statusHave: labels.statusHave ?? '',
                statusWishlist: labels.statusWishlist ?? '',
                statusBuy: labels.statusBuy ?? '',
                toastAddedWishlist: labels.toastAddedWishlist ?? '',
                toastAddedWishlistCart: labels.toastAddedWishlistCart ?? '',
              }}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="text-5xl mb-4 opacity-30">🦇</span>
          <p className="text-white/40 text-lg font-medium">{labels.emptyTitle}</p>
          <p className="text-white/20 text-sm mt-1">{labels.emptySub}</p>
          <button onClick={clearFilters} className="btn-ghost mt-4 text-sm">
            {labels.clearAllBtn}
          </button>
        </div>
      )}
    </div>
  )
}
