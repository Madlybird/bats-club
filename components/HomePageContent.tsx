import ScrollReveal from "@/components/ScrollReveal"
import ArchiveClient from "@/components/ArchiveClient"
import BuyToCartButton from "@/components/BuyToCartButton"
import Link from "next/link"
import Image from "next/image"
import type { Dict } from "@/lib/dict"

// /public/figures/ images — ?v=2 busts browser cache
const LOCAL_FIGURES = [
  "/figures/1.png?v=2",
  "/figures/2.png?v=2",
  "/figures/3.png?v=2",
  "/figures/4.png?v=2",
]

// Deterministic bat positions — 35 bats spread across full page height
const BAT_ANIMS = ["bat-wave-left", "bat-wave-right", "bat-wave-slight"] as const
const BATS = Array.from({ length: 140 }, (_, i) => ({
  x: (i * 37 + 5) % 95,
  y: (i * 41 + 8) % 98,
  duration: (9 + ((i * 1.3) % 9)) / 2,  // 2x faster
  delay: (i * 0.65) % 9,
  anim: BAT_ANIMS[i % 3],
}))

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
  cheapestListing?: { id: string; price: number; condition: string } | null
}

interface Props {
  dict: Dict
  figures: FigureData[]
  allManufacturers: string[]
  hasSession: boolean
  yearsCollecting: number
}

export default function HomePageContent({
  dict,
  figures,
  allManufacturers,
  hasSession,
  yearsCollecting,
}: Props) {
  const recentFigures = figures.slice(0, 4)

  return (
    <div className="relative">

      {/* ── Page-wide floating bats ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {BATS.map((b, i) => (
          <img
            key={i}
            src="/bat.png"
            alt=""
            width={56}
            height={56}
            className={i >= 5 ? "hidden md:block" : undefined}
            style={{
              position: "absolute",
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: 56,
              height: 56,
              opacity: 0,
              animation: `${b.anim} ${b.duration}s ease-in-out ${b.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* ────────────────────────────────────────
          1. HERO
      ──────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* dot grid texture */}
        <div
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* ambient blobs */}
        <div className="absolute top-1/3 right-1/3 w-[700px] h-[700px] rounded-full bg-[#ff2d78]/5 blur-[180px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-purple-900/6 blur-[120px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16">
          {/* Grid container is `relative` so gap-floating tags can be positioned inside it */}
          <div className="relative grid lg:grid-cols-2 gap-14 items-center">

            {/* Left text */}
            <div>
              <div className="flex items-center gap-3 mb-10">
                <span className="inline-block w-8 h-px bg-[#ff2d78]" />
                <span className="text-[11px] font-semibold tracking-[0.2em] text-white/25 uppercase">
                  {dict.hero_eyebrow}
                </span>
              </div>

              <h1 className="font-black leading-[0.88] tracking-tighter lowercase">
                <span
                  className="block text-white"
                  style={{ fontSize: "clamp(2.5rem, 8.5vw, 7rem)" }}
                >
                  {dict.hero_title}
                </span>
                {dict.hero_subtitle.map((line) => (
                  <span
                    key={line}
                    className="block mt-2"
                    style={{
                      fontSize: "clamp(2rem, 6.5vw, 5.25rem)",
                      color: "#ff2d78",
                      textShadow: "0 0 40px rgba(255,45,120,0.35)",
                    }}
                  >
                    {line}
                  </span>
                ))}
              </h1>

              <p className="mt-8 text-white/35 text-base leading-relaxed max-w-sm font-medium">
                {dict.hero_body}
              </p>

              <div className="flex flex-wrap gap-3 mt-10">
                <Link
                  href="/#archive"
                  className="px-8 py-3.5 text-sm font-bold lowercase tracking-wide text-white rounded-full transition-all"
                  style={{ background: "#ff2d78", boxShadow: "0 0 30px rgba(255,45,120,0.3)" }}
                >
                  {dict.hero_cta}
                </Link>
                {!hasSession && (
                  <Link
                    href="/register"
                    className="px-8 py-3.5 border border-white/10 hover:border-white/25 text-white/50 hover:text-white text-sm font-bold lowercase tracking-wide rounded-full transition-all"
                  >
                    {dict.hero_join}
                  </Link>
                )}
              </div>
            </div>

            {/* 6 floating tags — overlap the left edge of the right photo grid (~50%+ of container) */}
            <span className="hidden lg:inline float-tag animate-float-slow"   style={{ position:"absolute", top:"6%",  left:"52%", animationDelay:"0s"   }}>1990s Japan</span>
            <span className="hidden lg:inline float-tag animate-float-slow-2" style={{ position:"absolute", top:"23%", left:"50%", animationDelay:"1.1s" }}>Private collector archive</span>
            <span className="hidden lg:inline float-tag animate-float-slow"   style={{ position:"absolute", top:"41%", left:"53%", animationDelay:"0.5s" }}>Kotobukiya</span>
            <span className="hidden lg:inline float-tag animate-float-slow-2" style={{ position:"absolute", top:"59%", left:"51%", animationDelay:"1.6s" }}>Kaiyodo</span>
            <span className="hidden lg:inline float-tag animate-float-slow"   style={{ position:"absolute", top:"76%", left:"52%", animationDelay:"0.8s" }}>Original figures</span>
            <span className="hidden lg:inline float-tag animate-float-slow-2" style={{ position:"absolute", top:"91%", left:"50%", animationDelay:"1.3s" }}>Wonder Festival</span>

            {/* Right: figure grid — single-column stack on mobile, 2-col staggered on desktop */}
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-[280px] sm:max-w-[360px] mx-auto lg:ml-auto lg:mr-0">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="figure-grid-item aspect-square"
                    style={{ marginTop: i % 2 === 1 ? "24px" : "0" }}
                  >
                    <Image
                      src={LOCAL_FIGURES[i]}
                      alt={`figure ${i + 1}`}
                      fill
                      unoptimized
                      className="object-cover object-top"
                      sizes="(max-width: 640px) 80vw, 180px"
                    />
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────
          2. RECENT ADDITIONS
      ──────────────────────────────────────── */}
      {recentFigures.length > 0 && (
        <ScrollReveal>
          <section className="py-20 border-t border-white/[0.05]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-end justify-between mb-10">
                <div>
                  <span className="inline-block w-8 h-0.5 bg-[#ff2d78] mb-6" />
                  <h2
                    className="font-black lowercase leading-tight tracking-tighter text-white"
                    style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)" }}
                  >
                    {dict.recent_heading}
                  </h2>
                </div>
                <Link
                  href="/#archive"
                  className="text-xs font-bold text-white/25 hover:text-[#ff2d78] transition-colors lowercase tracking-wide"
                >
                  {dict.recent_link}
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {recentFigures.map((fig, i) => (
                  <ScrollReveal key={fig.id} delay={i * 70}>
                    <div className="group block">
                      {/* Image area: a fully-clickable Link sits behind the
                          BuyToCartButton, which is a sibling (NOT a child)
                          so we don't nest <button> inside <a>. */}
                      <div className="figure-grid-item aspect-square mb-4">
                        <Link
                          href={`/figures/${fig.id}`}
                          className="absolute inset-0 z-0"
                          aria-label={fig.name}
                        >
                          <Image
                            src={fig.imageUrl || LOCAL_FIGURES[i % LOCAL_FIGURES.length]}
                            alt={fig.name}
                            fill
                            // Bypass Vercel's image optimizer for
                            // the figure photos pulled from
                            // Supabase. Local fallbacks (the
                            // /figures/*.png pngs) are tiny so
                            // skipping optimization is a wash.
                            unoptimized
                            className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 768px) 50vw, 25vw"
                          />
                        </Link>
                        {fig._count.listings > 0 && (
                          <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
                            <span
                              className="text-[10px] px-2.5 py-1 rounded-full font-bold text-white"
                              style={{ background: "#ff2d78" }}
                            >
                              {dict.recent_for_sale}
                            </span>
                          </div>
                        )}
                        <div className="absolute bottom-2.5 right-2.5 z-20">
                          <BuyToCartButton
                            figureId={fig.id}
                            figureName={fig.name}
                            figureSeries={fig.series}
                            figureImageUrl={fig.imageUrl ?? null}
                            cheapestListing={fig.cheapestListing ?? null}
                            label={dict.fig_status_buy}
                            toastAdded={dict.fig_added_wishlist}
                            toastAddedWithCart={dict.fig_added_wishlist_cart}
                          />
                        </div>
                      </div>
                      <Link href={`/figures/${fig.id}`} className="block">
                        <p className="text-sm font-bold text-white group-hover:text-[#ff2d78] transition-colors lowercase leading-tight line-clamp-1">
                          {fig.name}
                        </p>
                        <p className="text-xs text-white/25 mt-1">
                          {fig.series} · {fig.year}
                        </p>
                      </Link>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* ────────────────────────────────────────
          3. HOW IT WORKS
      ──────────────────────────────────────── */}
      <ScrollReveal>
        <section className="py-20 border-t border-white/[0.05]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <span className="inline-block w-8 h-0.5 bg-[#ff2d78] mb-4" />
              <h2
                className="font-black lowercase leading-tight tracking-tighter text-white"
                style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)" }}
              >
                {dict.how_heading}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dict.how_steps.map((step, i) => (
                <ScrollReveal key={step.num} delay={i * 80}>
                  <div className="group p-6 rounded-2xl border border-white/[0.05] bg-white/[0.015] hover:border-[#ff2d78]/20 transition-colors flex flex-col">
                    <p
                      className="text-5xl font-black leading-none select-none mb-5"
                      style={{ color: "rgba(255,45,120,0.6)" }}
                    >
                      {step.num}
                    </p>
                    <h3 className="text-base font-bold text-white lowercase tracking-tight flex-1">
                      {step.title}
                    </h3>
                    <Link
                      href={step.href}
                      className="mt-4 text-xs text-[#ff2d78] font-bold lowercase tracking-wide hover:text-white transition-colors"
                    >
                      {step.cta} →
                    </Link>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ────────────────────────────────────────
          4. FULL ARCHIVE
      ──────────────────────────────────────── */}
      <ScrollReveal>
        <section id="archive" className="py-20 border-t border-white/[0.05]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <span className="inline-block w-8 h-0.5 bg-[#ff2d78] mb-4" />
              <h2
                className="font-black lowercase leading-tight tracking-tighter text-white"
                style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}
              >
                {dict.archive_heading}
              </h2>
            </div>

            <ArchiveClient
              figures={figures}
              manufacturers={allManufacturers}
              labels={{
                collectionsHeading: dict.archive_collections,
                searchPh: dict.archive_search_ph,
                characterLabel: dict.archive_series_label,
                mfgLabel: dict.archive_mfg_label,
                resultsWord: dict.archive_results,
                clearFilters: dict.archive_clear,
                emptyTitle: dict.archive_empty_title,
                emptySub: dict.archive_empty_sub,
                clearAllBtn: dict.archive_clear_all_btn,
              }}
            />
          </div>
        </section>
      </ScrollReveal>

    </div>
  )
}
