"use client"

import { useMemo, useState } from "react"
import ScrollReveal from "@/components/ScrollReveal"
import ArtCard from "@/components/ArtCard"
import type { AgeGateLabels } from "@/components/AgeGate"
import type { ArtListRow } from "@/lib/art"
import type { ArtStrings } from "@/lib/art-i18n"

interface Props {
  items: ArtListRow[]
  strings: ArtStrings
  basePath: string // "/art" | "/ru/art" | "/jp/art"
  ageGateLabels: AgeGateLabels
}

type Sort = "newest" | "price_asc" | "price_desc"

export default function ArtPageContent({ items, strings: s, basePath, ageGateLabels }: Props) {
  const [type, setType] = useState<string>("__all")
  const [sort, setSort] = useState<Sort>("newest")
  const [search, setSearch] = useState("")

  // Chips: only types that actually have a listing (spec: no empty categories).
  const types = useMemo(() => {
    const set = new Set(items.map((i) => i.type))
    return Array.from(set).sort()
  }, [items])

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = items
    if (type !== "__all") list = list.filter((i) => i.type === type)
    if (q) {
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          (i.series ?? "").toLowerCase().includes(q) ||
          i.type.toLowerCase().includes(q),
      )
    }
    const sorted = [...list]
    if (sort === "price_asc") sorted.sort((a, b) => a.price - b.price)
    else if (sort === "price_desc") sorted.sort((a, b) => b.price - a.price)
    else
      sorted.sort((a, b) => Date.parse(b.createdAt ?? "") - Date.parse(a.createdAt ?? ""))
    return sorted
  }, [items, type, sort, search])

  const cardLabels = {
    addToCart: s.add_to_cart,
    alreadyInCart: s.already_in_cart,
    badgeNew: s.badge_new,
    badgeSoldOut: s.badge_sold_out,
  }

  return (
    <div className="relative min-h-screen">
      <div className="scroll-layer absolute top-1/4 right-1/3 w-[700px] h-[700px] rounded-full bg-[#ff2d78]/5 blur-[180px] pointer-events-none" />
      <div className="scroll-layer absolute bottom-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-purple-900/6 blur-[120px] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative">
        <ScrollReveal>
          <div>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              <span className="inline-block w-8 h-px bg-[#ff2d78] mb-4" />
              <h1
                className="font-black lowercase leading-tight tracking-tighter text-white"
                style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)" }}
              >
                {s.heading}
              </h1>
            </div>
          </div>
        </ScrollReveal>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <ScrollReveal>
            {/* Search */}
            <div className="relative mb-5">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder={s.search_ph}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10 text-base sm:text-sm"
              />
            </div>

            {/* Type chips (only non-empty) + sort */}
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {types.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setType("__all")}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      type === "__all"
                        ? "bg-[#ff2d78]/15 border-[#ff2d78]/40 text-[#ff2d78]"
                        : "border-white/10 text-white/40 hover:text-white/70 hover:border-white/25"
                    }`}
                  >
                    {s.filter_all}
                  </button>
                  {types.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        type === t
                          ? "bg-[#ff2d78]/15 border-[#ff2d78]/40 text-[#ff2d78]"
                          : "border-white/10 text-white/40 hover:text-white/70 hover:border-white/25"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </>
              )}
              <div className="ml-auto">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as Sort)}
                  className="text-xs bg-[#0a0a12] border border-white/10 text-white/50 rounded-lg px-2 py-1.5 focus:outline-none focus:border-violet-700"
                >
                  <option value="newest">{s.sort_newest}</option>
                  <option value="price_asc">{s.sort_price_asc}</option>
                  <option value="price_desc">{s.sort_price_desc}</option>
                </select>
              </div>
            </div>

            {search && (
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-500">
                  <span className="font-semibold" style={{ color: "#ff2d78" }}>{shown.length}</span> {s.results}
                </p>
                <button onClick={() => setSearch("")} className="text-xs text-slate-500 hover:text-[#ff2d78] transition-colors">
                  {s.clear_search}
                </button>
              </div>
            )}
          </ScrollReveal>

          {shown.length > 0 ? (
            <ScrollReveal>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 items-stretch">
                {shown.map((item, i) => (
                  <ArtCard
                    key={item.id}
                    item={item}
                    labels={cardLabels}
                    ageGateLabels={ageGateLabels}
                    basePath={basePath}
                    priority={i < 4}
                  />
                ))}
              </div>
            </ScrollReveal>
          ) : (
            <ScrollReveal>
              <div className="mt-16 flex flex-col items-center justify-center text-center py-16">
                <span className="text-5xl mb-4 opacity-30">🦇</span>
                <p className="text-white/40 text-lg font-medium">{s.empty_title}</p>
                <p className="text-white/20 text-sm mt-1">{s.empty_sub}</p>
              </div>
            </ScrollReveal>
          )}
        </div>
      </div>
    </div>
  )
}
