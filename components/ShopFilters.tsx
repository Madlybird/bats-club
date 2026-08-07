"use client"

import { useRouter, usePathname } from "next/navigation"
import type { Dict } from "@/lib/dict"

interface ShopFiltersProps {
  currentPriceRange?: string
  currentSort?: string
  currentSeries?: string
  currentCollection?: string
  dict: Dict
}

export default function ShopFilters({ currentPriceRange, currentSort, currentSeries, currentCollection, dict }: ShopFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()

  // Value encodes [min, max] in cents, both inclusive; empty max = no
  // upper bound. Boundaries picked from the actual price distribution of
  // the catalog, offset by 1 cent so e.g. exactly $25.00 only falls in
  // "Under $25", not also in "$25-55".
  const PRICE_RANGES = [
    { value: "0-2500",      label: dict.shop_price_range_under_25 },
    { value: "2501-5500",   label: dict.shop_price_range_25_55 },
    { value: "5501-10000",  label: dict.shop_price_range_55_100 },
    { value: "10001-",      label: dict.shop_price_range_100_plus },
  ]

  const SORT_OPTIONS = [
    { value: "newest",     label: dict.shop_sort_newest },
    { value: "price_asc",  label: dict.shop_sort_price_asc },
    { value: "price_desc", label: dict.shop_sort_price_desc },
  ]

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams()
    if (key !== "price" && currentPriceRange) params.set("price", currentPriceRange)
    if (key !== "sort" && currentSort) params.set("sort", currentSort)
    if (key !== "series" && currentSeries) params.set("series", currentSeries)
    if (key !== "collection" && currentCollection) params.set("collection", currentCollection)
    if (value) params.set(key, value)
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  return (
    <div className="flex flex-col md:flex-row md:flex-wrap md:items-center gap-3 md:gap-4">
      {/* Price range — wraps instead of scrolling so buttons never get
          clipped at the viewport edge on narrow phones (4 buttons is
          tight for a single row under ~375px wide). */}
      <div className="flex items-start gap-2 min-w-0">
        <span className="flex-shrink-0 text-xs text-slate-500 font-medium uppercase tracking-wider mt-1.5">{dict.shop_price_range_label}:</span>
        <div className="flex flex-wrap gap-1.5">
          {PRICE_RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => updateFilter("price", currentPriceRange === r.value ? null : r.value)}
              className={`flex-shrink-0 text-xs px-2.5 py-1.5 rounded-lg border transition-all font-medium ${
                currentPriceRange === r.value
                  ? "bg-violet-700 border-violet-600 text-white"
                  : "bg-[#0a0a12] border-[#1a1a3a] text-slate-400 hover:border-violet-700/50 hover:text-slate-200"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2">
        <select
          value={currentSort || "newest"}
          onChange={(e) => updateFilter("sort", e.target.value === "newest" ? null : e.target.value)}
          className="input text-base sm:text-xs py-1.5 w-full md:w-auto"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
