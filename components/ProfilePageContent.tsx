"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import BatsOverlay from "@/components/BatsOverlay"
import InfoTooltip from "@/components/ui/InfoTooltip"
import type { Dict } from "@/lib/dict"

interface UserFigure {
  id: string
  figure: {
    id: string
    name: string
    series: string
    character: string
    imageUrl: string | null
    scale: string
    manufacturer: string
    year?: number | null
  }
}

interface ActiveListing {
  figureId: string
}

interface Props {
  user: {
    id: string
    name: string
    username: string
    avatar?: string | null
    bio?: string | null
    isAdmin: boolean
    createdAt: Date | string
  }
  have: UserFigure[]
  wishlist: UserFigure[]
  dict: Dict
  archiveHref: string
  profileBasePath: string
  isOwner?: boolean
  purchaseCount: number
  rarityScore: number
  rarityPercentile: number
  huntingCounts: Record<string, number>
  activeListings: ActiveListing[]
  locale: "en" | "ru" | "jp"
}

const MONTHS_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"]
const MONTHS_RU = ["январь","февраль","март","апрель","май","июнь","июль","август","сентябрь","октябрь","ноябрь","декабрь"]

function formatMemberSince(dateStr: Date | string, locale: "en" | "ru" | "jp"): string {
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = d.getMonth()
  if (locale === "jp") return `${y}年${m + 1}月`
  if (locale === "ru") return `${MONTHS_RU[m]} ${y}`
  return `${MONTHS_EN[m]} ${y}`
}

function getEra(year: number | null | undefined, locale: "en" | "ru" | "jp"): string {
  const labels: Record<string, Record<string, string>> = {
    "90s": { en: "1990s", ru: "1990-е", jp: "1990年代" },
    "early00s": { en: "Early 2000s", ru: "Ранние 2000-е", jp: "2000年代前半" },
    "late00s": { en: "Late 2000s", ru: "Поздние 2000-е", jp: "2000年代後半" },
    "2010s": { en: "2010s+", ru: "2010-е и позже", jp: "2010年代以降" },
  }
  if (!year) return labels["2010s"][locale]
  if (year < 2000) return labels["90s"][locale]
  if (year <= 2004) return labels["early00s"][locale]
  if (year <= 2009) return labels["late00s"][locale]
  return labels["2010s"][locale]
}

export default function ProfilePageContent({
  user,
  have,
  wishlist,
  dict,
  archiveHref,
  profileBasePath,
  isOwner = false,
  purchaseCount,
  rarityScore,
  rarityPercentile,
  huntingCounts,
  activeListings,
  locale,
}: Props) {
  const memberSince = formatMemberSince(user.createdAt, locale)
  const stamps = purchaseCount % 10
  const activeListingFigureIds = new Set(activeListings.map((l) => l.figureId))
  const [collectionExpanded, setCollectionExpanded] = useState(false)

  // Series DNA
  const seriesMap = new Map<string, { series: string; era: string; count: number }>()
  for (const item of have) {
    const era = getEra(item.figure.year, locale)
    const key = `${item.figure.series}__${era}`
    const existing = seriesMap.get(key)
    if (existing) {
      existing.count++
    } else {
      seriesMap.set(key, { series: item.figure.series, era, count: 1 })
    }
  }
  const seriesDna = Array.from(seriesMap.values()).sort((a, b) => b.count - a.count)
  const topSeriesKeys = new Set(seriesDna.slice(0, 2).map((s) => `${s.series}__${s.era}`))

  const displayCollection = collectionExpanded ? have : have.slice(0, 6)

  return (
    <div className="relative min-h-screen" style={{ background: "#0e0408" }}>
      {/* 1. Bat animation */}
      <BatsOverlay />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* ── 1. Hero ── */}
        <section className="flex flex-col items-center text-center gap-4">
          <div className="relative">
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={user.name}
                width={72}
                height={72}
                unoptimized
                className="rounded-full"
                style={{ border: "2px solid #ff2d78" }}
              />
            ) : (
              <div
                className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-2xl font-black"
                style={{ background: "#000", border: "2px solid #ff2d78", color: "#fff" }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            {user.isAdmin && (
              <span
                className="absolute -bottom-1 -right-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: "#ff2d78", color: "#fff" }}
              >
                Admin
              </span>
            )}
          </div>

          {/* 2. Name + username + inline edit button */}
          <div>
            <h1 className="text-2xl font-black" style={{ color: "#f0e0e0" }}>{user.name}</h1>
            <div className="flex items-center justify-center gap-2 mt-0.5">
              <p className="text-sm" style={{ color: "rgba(240,224,224,0.4)" }}>@{user.username}</p>
              {isOwner && (
                <Link
                  href={`${profileBasePath}/${user.username}/edit`}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-md transition-colors"
                  style={{
                    border: "1px solid rgba(255,45,120,0.25)",
                    color: "rgba(240,224,224,0.5)",
                    background: "rgba(255,45,120,0.08)",
                  }}
                >
                  {dict.profile_edit}
                </Link>
              )}
            </div>
          </div>

          {user.bio && (
            <p className="text-sm max-w-md leading-relaxed" style={{ color: "rgba(240,224,224,0.5)" }}>{user.bio}</p>
          )}

          <p className="text-xs" style={{ color: "rgba(240,224,224,0.3)" }}>
            {dict.profile_member_since} {memberSince}
          </p>

          {/* 3. Share row + Share Profile button */}
          <div className="flex items-center gap-3">
            <ShareIcon
              label="Telegram"
              href={`https://t.me/share/url?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}&text=${encodeURIComponent(`${user.username}'s collection`)}`}
              svg={<path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12.056 0h-.112zM8.016 8.2a.14.14 0 0 1 .072.02l1.072.68 4.624 2.928c.04.024.04.064 0 .088L9.16 14.84l-1.072.68a.14.14 0 0 1-.072.02c-.056 0-.096-.04-.096-.096V8.296c0-.056.04-.096.096-.096z" fill="currentColor"/>}
            />
            <ShareIcon
              label="WhatsApp"
              href={`https://wa.me/?text=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
              svg={<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.05 21.785a9.84 9.84 0 0 1-5.012-1.373l-.36-.214-3.732.979.996-3.641-.235-.374A9.864 9.864 0 0 1 2.193 12.1c0-5.458 4.44-9.897 9.9-9.897 2.646 0 5.13 1.03 6.998 2.9a9.825 9.825 0 0 1 2.898 6.994c-.003 5.458-4.443 9.898-9.9 9.898l-.04-.01zm8.413-18.27A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892a11.864 11.864 0 0 0 1.588 5.945L0 24l6.335-1.662a11.866 11.866 0 0 0 5.71 1.453h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" fill="currentColor"/>}
            />
            <ShareIcon
              label="Line"
              href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
              svg={<path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386a.63.63 0 0 1-.63-.629V8.108a.63.63 0 0 1 .63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016a.63.63 0 0 1-.63.629.626.626 0 0 1-.51-.262l-2.445-3.339v2.972a.63.63 0 0 1-1.26 0V8.108a.629.629 0 0 1 .63-.63c.2 0 .385.096.51.262l2.445 3.333V8.108a.63.63 0 0 1 1.26 0v4.771zm-6.078.629a.63.63 0 0 1-.63-.629V8.108a.63.63 0 0 1 1.26 0v4.771a.63.63 0 0 1-.63.629zm-2.908 0H4.138a.63.63 0 0 1-.63-.629V8.108a.63.63 0 0 1 1.26 0v4.141h1.755c.349 0 .63.283.63.63a.627.627 0 0 1-.63.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" fill="currentColor"/>}
            />
            <CopyLinkButton label={dict.profile_share} />
            <ShareProfileButton label={dict.profile_share_profile} />
          </div>
        </section>

        {/* ── 2. Stats Bar ── */}
        <section
          className="grid grid-cols-3 gap-px rounded-lg overflow-hidden"
          style={{ border: "1px solid rgba(255,45,120,0.13)" }}
        >
          <StatCell value={have.length} label={dict.profile_collection} />
          <StatCell value={wishlist.length} label={dict.profile_hunting} />
          <StatCell value={purchaseCount} label={dict.profile_purchases} />
        </section>

        {/* ── 3. Rarity Score with neon glow ── */}
        {have.length > 0 && (
          <section
            className="rounded-lg p-5 space-y-3"
            style={{ background: "rgba(255,45,120,0.08)", border: "1px solid rgba(255,45,120,0.13)" }}
          >
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold" style={{ color: "#f0e0e0" }}>
                {dict.profile_rarity_score}
              </h2>
              <InfoTooltip text={dict.profile_rarity_tooltip} />
            </div>
            <div className="flex items-baseline gap-3">
              <span
                className="text-3xl font-black"
                style={{
                  color: "#ff2d78",
                  textShadow: "0 0 10px rgba(255,45,120,0.6), 0 0 30px rgba(255,45,120,0.3), 0 0 60px rgba(255,45,120,0.15)",
                }}
              >
                {rarityScore.toFixed(1)}
              </span>
              <span className="text-xs" style={{ color: "rgba(240,224,224,0.4)" }}>
                {dict.profile_rarity_percentile.replace("{X}", String(rarityPercentile))}
              </span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: "rgba(255,45,120,0.13)" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, 100 - rarityPercentile)}%`,
                  background: "#ff2d78",
                  boxShadow: "0 0 8px rgba(255,45,120,0.6), 0 0 20px rgba(255,45,120,0.3)",
                }}
              />
            </div>
          </section>
        )}

        {/* ── 4. Stamp Card (compact) ── */}
        <section
          className="rounded-lg p-4 space-y-3"
          style={{ background: "rgba(255,45,120,0.08)", border: "1px solid rgba(255,45,120,0.13)" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold" style={{ color: "#f0e0e0" }}>
                {dict.profile_stamp_card}
              </h2>
              <InfoTooltip text={dict.profile_stamp_tooltip} />
            </div>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(255,45,120,0.15)", color: "#ff2d78", border: "1px solid rgba(255,45,120,0.25)" }}
            >
              {dict.profile_stamps_left.replace("{X}", String(10 - stamps))}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1.5 max-w-[280px] mx-auto">
            {Array.from({ length: 10 }).map((_, i) => {
              const filled = i < stamps
              const isLast = i === 9
              return (
                <div
                  key={i}
                  className="aspect-square rounded flex items-center justify-center"
                  style={{
                    background: filled ? "rgba(255,45,120,0.2)" : "rgba(255,45,120,0.04)",
                    border: `1px solid ${isLast ? "rgba(255,45,120,0.5)" : "rgba(255,45,120,0.13)"}`,
                  }}
                >
                  {filled ? (
                    <img src="/bat.png" alt="" width={20} height={20} style={{ opacity: 0.8 }} />
                  ) : isLast ? (
                    <span className="text-[9px] font-bold" style={{ color: "#ff2d78" }}>
                      {dict.profile_stamp_claim}
                    </span>
                  ) : null}
                </div>
              )
            })}
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,45,120,0.13)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${stamps * 10}%`, background: "#ff2d78" }}
            />
          </div>
          <p className="text-[10px] text-center" style={{ color: "rgba(240,224,224,0.3)" }}>
            {dict.profile_stamp_reward}
          </p>
        </section>

        {/* ── 5. Series DNA ── */}
        {seriesDna.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold" style={{ color: "#f0e0e0" }}>Series DNA</h2>
              <InfoTooltip text={dict.profile_series_dna_tooltip} />
            </div>
            <div className="space-y-2">
              {seriesDna.map((entry) => {
                const key = `${entry.series}__${entry.era}`
                const hot = topSeriesKeys.has(key)
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-md px-3 py-2"
                    style={{
                      background: hot ? "rgba(255,45,120,0.12)" : "rgba(255,45,120,0.04)",
                      border: `1px solid ${hot ? "rgba(255,45,120,0.35)" : "rgba(255,45,120,0.13)"}`,
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium truncate" style={{ color: "#f0e0e0" }}>
                        {entry.series}
                      </span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-sm flex-shrink-0"
                        style={{ background: "rgba(255,45,120,0.15)", color: "rgba(240,224,224,0.5)" }}
                      >
                        {entry.era}
                      </span>
                    </div>
                    <span className="text-xs font-bold flex-shrink-0 ml-2" style={{ color: "#ff2d78" }}>
                      {entry.count}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── 6. Hunt Board ── */}
        <section className="space-y-3" id="hunt-board">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold" style={{ color: "#f0e0e0" }}>Hunt Board</h2>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-sm"
              style={{ background: "rgba(255,45,120,0.1)", color: "rgba(240,224,224,0.4)" }}
            >
              {dict.profile_public_wishlist}
            </span>
            <InfoTooltip text={dict.profile_hunt_tooltip} />
            {/* 7. Hunt Board share button */}
            <HuntShareButton label={dict.profile_hunt_share} />
          </div>
          {wishlist.length === 0 ? (
            <p className="text-sm italic" style={{ color: "rgba(240,224,224,0.25)" }}>
              {dict.profile_hunt_empty}
            </p>
          ) : (
            <div className="space-y-2">
              {wishlist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-md px-3 py-2"
                  style={{ background: "rgba(255,45,120,0.04)", border: "1px solid rgba(255,45,120,0.13)" }}
                >
                  <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0" style={{ background: "#000" }}>
                    {item.figure.imageUrl ? (
                      <Image
                        src={item.figure.imageUrl}
                        alt={item.figure.name}
                        width={40}
                        height={40}
                        unoptimized
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs opacity-30">🦇</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "#f0e0e0" }}>{item.figure.name}</p>
                    <p className="text-[11px]" style={{ color: "rgba(240,224,224,0.35)" }}>
                      {item.figure.manufacturer}{item.figure.year ? ` · ${item.figure.year}` : ""}
                    </p>
                  </div>
                  {(huntingCounts[item.figure.id] ?? 0) > 0 && (
                    <span className="text-[10px] flex-shrink-0" style={{ color: "rgba(240,224,224,0.35)" }}>
                      {huntingCounts[item.figure.id]} {dict.profile_also_hunting}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── 7. Collection Grid ── */}
        {have.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-bold" style={{ color: "#f0e0e0" }}>{dict.profile_collection}</h2>
            <div className="grid grid-cols-3 gap-2">
              {displayCollection.map((item) => {
                const forSale = activeListingFigureIds.has(item.figure.id)
                return (
                  <Link
                    key={item.id}
                    href={`/figures/${item.figure.id}`}
                    className="group rounded-lg overflow-hidden"
                    style={{ background: "#0a0408", border: "1px solid rgba(255,45,120,0.13)" }}
                  >
                    <div className="relative aspect-square">
                      {item.figure.imageUrl ? (
                        <Image
                          src={item.figure.imageUrl}
                          alt={item.figure.name}
                          fill
                          unoptimized
                          className="object-cover object-top group-hover:scale-105 transition-transform duration-300"
                          sizes="200px"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl opacity-20">🦇</span>
                        </div>
                      )}
                      {forSale && (
                        <span
                          className="absolute top-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-sm"
                          style={{ background: "#ff2d78", color: "#fff" }}
                        >
                          {dict.profile_for_sale}
                        </span>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium line-clamp-2 leading-tight group-hover:text-[#ff2d78] transition-colors" style={{ color: "rgba(240,224,224,0.7)" }}>
                        {item.figure.name}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: "rgba(240,224,224,0.3)" }}>
                        {item.figure.manufacturer}{item.figure.year ? ` · ${item.figure.year}` : ""}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
            {have.length > 6 && !collectionExpanded && (
              <button
                onClick={() => setCollectionExpanded(true)}
                className="text-xs font-medium transition-colors"
                style={{ color: "#ff2d78" }}
              >
                {dict.profile_view_all} ({have.length})
              </button>
            )}
          </section>
        )}

        {/* Empty state */}
        {have.length === 0 && wishlist.length === 0 && (
          <div className="text-center py-16">
            <span className="text-5xl block mb-4 opacity-20">🦇</span>
            <p className="text-lg" style={{ color: "rgba(240,224,224,0.3)" }}>{dict.profile_no_figures}</p>
            <Link
              href={archiveHref}
              className="inline-block mt-4 px-6 py-2.5 text-sm font-bold rounded-full transition-opacity hover:opacity-80"
              style={{ background: "#ff2d78", color: "#fff" }}
            >
              {dict.profile_browse_archive}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCell({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center py-4" style={{ background: "rgba(255,45,120,0.04)" }}>
      <p className="text-xl font-black" style={{ color: "#ff2d78" }}>{value}</p>
      <p className="text-[11px]" style={{ color: "rgba(240,224,224,0.4)" }}>{label}</p>
    </div>
  )
}

function ShareIcon({ label, href, svg }: { label: string; href: string; svg: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
      style={{ background: "rgba(255,45,120,0.08)", color: "rgba(240,224,224,0.4)", border: "1px solid rgba(255,45,120,0.13)" }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24">{svg}</svg>
    </a>
  )
}

function CopyLinkButton({ label }: { label: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }
  return (
    <button
      onClick={handleCopy}
      className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
      style={{ background: copied ? "rgba(255,45,120,0.2)" : "rgba(255,45,120,0.08)", color: "rgba(240,224,224,0.4)", border: "1px solid rgba(255,45,120,0.13)" }}
      title={label}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {copied ? (
          <path d="M5 13l4 4L19 7" />
        ) : (
          <>
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </>
        )}
      </svg>
    </button>
  )
}

function ShareProfileButton({ label }: { label: string }) {
  const handleShare = () => {
    if (typeof window !== "undefined" && navigator.share) {
      navigator.share({ url: window.location.href, title: document.title })
    } else if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href)
    }
  }
  return (
    <button
      onClick={handleShare}
      className="text-[11px] font-medium px-3 py-1 rounded-full transition-colors"
      style={{
        background: "rgba(255,45,120,0.08)",
        color: "rgba(240,224,224,0.5)",
        border: "1px solid rgba(255,45,120,0.2)",
      }}
    >
      {label}
    </button>
  )
}

function HuntShareButton({ label }: { label: string }) {
  const [copied, setCopied] = useState(false)
  const handleShare = () => {
    if (typeof window !== "undefined") {
      const url = window.location.href.split("#")[0] + "#hunt-board"
      navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }
  return (
    <button
      onClick={handleShare}
      className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-md transition-colors"
      style={{
        background: copied ? "rgba(255,45,120,0.2)" : "rgba(255,45,120,0.08)",
        color: copied ? "#ff2d78" : "rgba(240,224,224,0.4)",
        border: "1px solid rgba(255,45,120,0.13)",
      }}
    >
      {copied ? "✓" : label}
    </button>
  )
}
