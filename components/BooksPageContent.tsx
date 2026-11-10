"use client"

import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import ScrollReveal from "@/components/ScrollReveal"
import BookCard from "@/components/BookCard"
import type { AgeGateLabels } from "@/components/AgeGate"
import { BOOK_CONDITIONS } from "@/lib/books-constants"
import type { BookListRow } from "@/lib/books"
import type { BooksStrings } from "@/lib/books-i18n"

interface Props {
  items: BookListRow[]
  strings: BooksStrings
  basePath: string // "/books" | "/ru/books" | "/jp/books"
  ageGateLabels: AgeGateLabels
}

type Sort = "newest" | "price_asc" | "price_desc"
type Price = "any" | "u30" | "30_60" | "o60"
type Preset = "new" | "under30" | "obi" | "japanese"

const NEW_WINDOW_MS = 30 * 24 * 60 * 60 * 1000
const ALL = "__all"

const isJapanese = (lang: string | null) => /japan|日本|^jp\b|^ja\b/i.test(lang ?? "")
const hasObi = (includes: string[]) => includes.some((x) => /obi|帯|оби/i.test(x))

function priceOk(cents: number, p: Price) {
  if (p === "u30") return cents < 3000
  if (p === "30_60") return cents >= 3000 && cents <= 6000
  if (p === "o60") return cents > 6000
  return true
}

const chip = (active: boolean) =>
  `text-xs px-3 py-1.5 rounded-full border transition-colors ${
    active
      ? "bg-[#ff2d78]/15 border-[#ff2d78]/40 text-[#ff2d78]"
      : "border-white/10 text-white/40 hover:text-white/70 hover:border-white/25"
  }`

const selectCls =
  "text-xs bg-[#0a0a12] border border-white/10 text-white/60 rounded-lg px-2 py-1.5 focus:outline-none focus:border-violet-700 max-w-[11rem]"

export default function BooksPageContent({ items, strings: s, basePath, ageGateLabels }: Props) {
  const params = useSearchParams()
  const [type, setType] = useState<string>(params.get("type") || ALL)
  const [series, setSeries] = useState<string>(params.get("series") || ALL)
  const [language, setLanguage] = useState<string>(ALL)
  const [condition, setCondition] = useState<string>(ALL)
  const [price, setPrice] = useState<Price>("any")
  const [preset, setPreset] = useState<Preset | null>(null)
  const [sort, setSort] = useState<Sort>("newest")
  const [search, setSearch] = useState("")

  // Options come from the data itself — never show an empty choice.
  const types = useMemo(() => Array.from(new Set(items.map((i) => i.type))).sort(), [items])
  const seriesList = useMemo(
    () => Array.from(new Set(items.map((i) => i.series).filter((x): x is string => !!x))).sort(),
    [items],
  )
  const languages = useMemo(
    () => Array.from(new Set(items.map((i) => i.language).filter((x): x is string => !!x))).sort(),
    [items],
  )
  const conditions = useMemo(
    () => BOOK_CONDITIONS.filter((c) => items.some((i) => i.condition === c)),
    [items],
  )
  const presetAvailable: Record<Preset, boolean> = useMemo(
    () => ({
      new: items.some((i) => i.createdAt && Date.now() - Date.parse(i.createdAt) < NEW_WINDOW_MS),
      under30: items.some((i) => i.price < 3000),
      obi: items.some((i) => hasObi(i.includes)),
      japanese: items.some((i) => isJapanese(i.language)),
    }),
    [items],
  )

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = items.filter(
      (i) =>
        (type === ALL || i.type === type) &&
        (series === ALL || i.series === series) &&
        (language === ALL || i.language === language) &&
        (condition === ALL || i.condition === condition) &&
        priceOk(i.price, price),
    )
    if (preset === "new") list = list.filter((i) => i.createdAt && Date.now() - Date.parse(i.createdAt) < NEW_WINDOW_MS)
    if (preset === "under30") list = list.filter((i) => i.price < 3000)
    if (preset === "obi") list = list.filter((i) => hasObi(i.includes))
    if (preset === "japanese") list = list.filter((i) => isJapanese(i.language))
    if (q) {
      list = list.filter((i) =>
        [i.title, i.titleOriginal, i.author, i.publisher, i.series, i.type]
          .some((f) => (f ?? "").toLowerCase().includes(q)),
      )
    }
    const sorted = [...list]
    if (sort === "price_asc") sorted.sort((a, b) => a.price - b.price)
    else if (sort === "price_desc") sorted.sort((a, b) => b.price - a.price)
    else sorted.sort((a, b) => Date.parse(b.createdAt ?? "") - Date.parse(a.createdAt ?? ""))
    return sorted
  }, [items, type, series, language, condition, price, preset, sort, search])

  const anyFilter =
    type !== ALL || series !== ALL || language !== ALL || condition !== ALL || price !== "any" || preset !== null || !!search
  const reset = () => {
    setType(ALL)
    setSeries(ALL)
    setLanguage(ALL)
    setCondition(ALL)
    setPrice("any")
    setPreset(null)
    setSearch("")
  }

  const presets: { key: Preset; label: string }[] = [
    { key: "new", label: s.preset_new },
    { key: "under30", label: s.preset_under_30 },
    { key: "obi", label: s.preset_with_obi },
    { key: "japanese", label: s.preset_japanese },
  ]
  const visiblePresets = presets.filter((p) => presetAvailable[p.key])

  const cardLabels = {
    addToCart: s.add_to_cart,
    alreadyInCart: s.already_in_cart,
    badgeNew: s.badge_new,
    badgeSoldOut: s.badge_sold_out,
    conditionNames: s.condition_names,
  }

  return (
    <div className="relative min-h-screen">
      <div className="scroll-layer absolute top-1/4 right-1/3 w-[700px] h-[700px] rounded-full bg-[#ff2d78]/5 blur-[180px] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative">
        <ScrollReveal>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
            <span className="inline-block w-8 h-px bg-[#ff2d78] mb-4" />
            <h1
              className="font-black lowercase leading-tight tracking-tighter text-white"
              style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)" }}
            >
              {s.heading}
            </h1>
            <p className="text-white/40 text-sm mt-2 max-w-xl">{s.intro}</p>
          </div>
        </ScrollReveal>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 mt-6">
          <div data-area="books_filters">
            {/* Search */}
            <div className="relative mb-4">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder={s.search_ph}
                value={search}
                data-track="search"
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10 text-base sm:text-sm"
              />
            </div>

            {/* Quick picks */}
            {visiblePresets.length > 0 && (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider text-white/25 mr-1">{s.presets}</span>
                {visiblePresets.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    data-track="preset"
                    data-track-value={p.key}
                    onClick={() => setPreset(preset === p.key ? null : p.key)}
                    className={chip(preset === p.key)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}

            {/* Type chips (only non-empty) */}
            {types.length > 1 && (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <button type="button" data-track="filter_type" data-track-value="all" onClick={() => setType(ALL)} className={chip(type === ALL)}>
                  {s.filter_all}
                </button>
                {types.map((t) => (
                  <button key={t} type="button" data-track="filter_type" data-track-value={t} onClick={() => setType(t)} className={chip(type === t)}>
                    {t}
                  </button>
                ))}
              </div>
            )}

            {/* Dropdown filters + sort */}
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {seriesList.length > 1 && (
                <select aria-label={s.filter_series} value={series} data-track="filter_series" onChange={(e) => setSeries(e.target.value)} className={selectCls}>
                  <option value={ALL}>{s.filter_series}: {s.filter_any}</option>
                  {seriesList.map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
              )}
              {languages.length > 1 && (
                <select aria-label={s.filter_language} value={language} data-track="filter_language" onChange={(e) => setLanguage(e.target.value)} className={selectCls}>
                  <option value={ALL}>{s.filter_language}: {s.filter_any}</option>
                  {languages.map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
              )}
              {conditions.length > 1 && (
                <select aria-label={s.filter_condition} value={condition} data-track="filter_condition" onChange={(e) => setCondition(e.target.value)} className={selectCls}>
                  <option value={ALL}>{s.filter_condition}: {s.filter_any}</option>
                  {conditions.map((x) => <option key={x} value={x}>{s.condition_names[x] ?? x}</option>)}
                </select>
              )}
              {items.length > 1 && (
                <select aria-label={s.filter_price} value={price} data-track="filter_price" onChange={(e) => setPrice(e.target.value as Price)} className={selectCls}>
                  <option value="any">{s.filter_price}: {s.filter_any}</option>
                  <option value="u30">{s.price_under_30}</option>
                  <option value="30_60">{s.price_30_60}</option>
                  <option value="o60">{s.price_over_60}</option>
                </select>
              )}
              {anyFilter && (
                <button type="button" onClick={reset} data-track="reset_filters" className="text-xs text-white/40 hover:text-[#ff2d78] transition-colors px-1">
                  {s.reset_filters}
                </button>
              )}
              <div className="ml-auto">
                <select value={sort} data-track="sort" onChange={(e) => setSort(e.target.value as Sort)} className={selectCls}>
                  <option value="newest">{s.sort_newest}</option>
                  <option value="price_asc">{s.sort_price_asc}</option>
                  <option value="price_desc">{s.sort_price_desc}</option>
                </select>
              </div>
            </div>

            {anyFilter && (
              <p className="text-sm text-slate-500 mb-4">
                <span className="font-semibold" style={{ color: "#ff2d78" }}>{shown.length}</span> {s.results}
              </p>
            )}
          </div>

          {shown.length > 0 ? (
            <div data-area="books_grid" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 items-stretch">
              {shown.map((item, i) => (
                <BookCard
                  key={item.id}
                  item={item}
                  labels={cardLabels}
                  ageGateLabels={ageGateLabels}
                  basePath={basePath}
                  priority={i < 4}
                />
              ))}
            </div>
          ) : (
            <div className="mt-16 flex flex-col items-center justify-center text-center py-16">
              <span className="text-5xl mb-4 opacity-30">📚</span>
              <p className="text-white/40 text-lg font-medium">{s.empty_title}</p>
              <p className="text-white/20 text-sm mt-1">{s.empty_sub}</p>
              {anyFilter && (
                <button type="button" onClick={reset} className="mt-4 text-sm text-[#ff2d78] hover:underline">
                  {s.reset_filters}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
