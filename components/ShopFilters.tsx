"use client"

import { useRouter, usePathname } from "next/navigation"
import type { Dict } from "@/lib/dict"

interface ShopFiltersProps {
  currentCondition?: string
  currentSort?: string
  currentSeries?: string
  dict: Dict
}

export default function ShopFilters({ currentCondition, currentSort, currentSeries, dict }: ShopFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()

  const CONDITIONS = [
    { value: "Mint",      label: dict.shop_condition_mint },
    { value: "Near Mint", label: dict.shop_condition_near_mint },
    { value: "Good",      label: dict.shop_condition_good },
    { value: "Fair",      label: dict.shop_condition_fair },
    { value: "Poor",      label: dict.shop_condition_poor },
  ]

  const SORT_OPTIONS = [
    { value: "newest",     label: dict.shop_sort_newest },
    { value: "price_asc",  label: dict.shop_sort_price_asc },
    { value: "price_desc", label: dict.shop_sort_price_desc },
  ]

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams()
    if (key !== "condition" && currentCondition) params.set("condition", currentCondition)
    if (key !== "sort" && currentSort) params.set("sort", currentSort)
    if (key !== "series" && currentSeries) params.set("series", currentSeries)
    if (value) params.set(key, value)
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  return (
    <div className="flex flex-col md:flex-row md:flex-wrap md:items-center gap-3 md:gap-4">
      {/* Condition */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="flex-shrink-0 text-xs text-slate-500 font-medium uppercase tracking-wider">{dict.shop_condition_label}:</span>
        <div
          className="flex gap-1.5 md:flex-wrap overflow-x-auto md:overflow-visible scrollbar-none pb-1 md:pb-0"
          style={{ scrollbarWidth: "none" }}
        >
          {CONDITIONS.map((c) => (
            <button
              key={c.value}
              onClick={() => updateFilter("condition", currentCondition === c.value ? null : c.value)}
              className={`flex-shrink-0 text-xs px-2.5 py-1.5 rounded-lg border transition-all font-medium ${
                currentCondition === c.value
                  ? "bg-violet-700 border-violet-600 text-white"
                  : "bg-[#0a0a12] border-[#1a1a3a] text-slate-400 hover:border-violet-700/50 hover:text-slate-200"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2">
        <select
          value={currentSort || "newest"}
          onChange={(e) => updateFilter("sort", e.target.value === "newest" ? null : e.target.value)}
          className="input text-xs py-1.5 w-full md:w-auto"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
