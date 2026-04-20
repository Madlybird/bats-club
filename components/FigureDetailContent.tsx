import Image from "next/image"
import Link from "next/link"
import StatusButton from "@/components/StatusButton"
import ArticleCard from "@/components/ArticleCard"
import BatsOverlay from "@/components/BatsOverlay"
import ScrollReveal from "@/components/ScrollReveal"
import ShareButtons from "@/components/ShareButtons"
import PhotoCarousel from "@/components/PhotoCarousel"
import FigureViewTracker from "@/components/FigureViewTracker"
import type { Dict } from "@/lib/dict"

function parseImages(raw: unknown): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.filter((u): u is string => typeof u === "string")
  if (typeof raw === "string") {
    try { const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed.filter((u): u is string => typeof u === "string") : [] }
    catch { return [] }
  }
  return []
}

interface Article {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  coverImage?: string | null
  createdAt: Date | string
  author: { name: string; username: string; avatar?: string | null }
}

interface Props {
  figure: {
    id: string
    name: string
    character: string
    series: string
    manufacturer: string
    scale: string
    year: number
    sculptor?: string | null
    material?: string | null
    imageUrl?: string | null
    images?: string[] | null
    description?: string | null
    descriptionLocale?: string | null
  }
  publishedArticles: Article[]
  relatedFigures?: { id: string; slug?: string | null; name: string; series: string; imageUrl?: string | null; images?: unknown }[]
  userStatus: string | null
  wishlistCount: number
  haveCount: number
  lowestPrice: number | null
  convertedLowestPrice?: string | null
  /** Cheapest active listing for this figure, if any. Powers the
   *  "Want to Buy" → cart side effect on StatusButton. */
  cheapestListing?: { id: string; price: number; condition: string } | null
  jsonLd: object
  dict: Dict
  archiveHref: string
}

export default function FigureDetailContent({
  figure,
  publishedArticles,
  relatedFigures = [],
  userStatus,
  wishlistCount,
  haveCount,
  lowestPrice,
  convertedLowestPrice,
  cheapestListing = null,
  jsonLd,
  dict,
  archiveHref,
}: Props) {
  const NON_SCALE_VALUES = new Set(["non-scale", "nonscale", "non scale", "1/1", "-", "n/a"])
  const scaleDisplay = figure.scale && NON_SCALE_VALUES.has(figure.scale.toLowerCase())
    ? dict.fig_non_scale
    : figure.scale
  const descriptionDisplay = figure.descriptionLocale || figure.description

  const specs = [
    { label: dict.fig_spec_character, value: figure.character },
    { label: dict.fig_spec_series, value: figure.series },
    { label: dict.fig_spec_manufacturer, value: figure.manufacturer },
    { label: dict.fig_spec_scale, value: scaleDisplay },
    { label: dict.fig_spec_year, value: figure.year.toString() },
    { label: dict.fig_spec_sculptor, value: figure.sculptor },
    { label: dict.fig_spec_material, value: figure.material },
    { label: dict.fig_spec_description, value: descriptionDisplay },
  ].filter((s) => s.value)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <FigureViewTracker series={figure.series} />
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
          {/* Breadcrumb */}
          <ScrollReveal>
            <div className="border-b border-white/[0.05]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <nav className="flex items-center gap-2 text-sm text-white/30">
                  <Link href={archiveHref} className="hover:text-[#ff2d78] transition-colors">
                    {dict.fig_breadcrumb}
                  </Link>
                  <span>/</span>
                  <span className="text-white/60">{figure.name}</span>
                </nav>
              </div>
            </div>
          </ScrollReveal>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <ScrollReveal>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Left: Image */}
                <div className="space-y-4">
                  <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/[0.06]" style={{ background: "rgba(15,15,26,0.8)" }}>
                    <PhotoCarousel
                      images={(() => {
                        const imgs = parseImages((figure as any).images)
                        if (imgs.length > 0) return imgs
                        return figure.imageUrl ? [figure.imageUrl] : []
                      })()}
                      alt={figure.name}
                      priority
                    />
                  </div>

                  {/* Community stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/[0.06] p-4 text-center" style={{ background: "rgba(255,255,255,0.02)" }}>
                      <p className="text-2xl font-black" style={{ color: "#ff2d78" }}>{wishlistCount}</p>
                      <p className="text-xs text-white/30 mt-0.5">{dict.fig_wishlisting} ❤️</p>
                    </div>
                    <div className="rounded-2xl border border-white/[0.06] p-4 text-center" style={{ background: "rgba(255,255,255,0.02)" }}>
                      <p className="text-2xl font-black text-emerald-400">{haveCount}</p>
                      <p className="text-xs text-white/30 mt-0.5">{dict.fig_have}</p>
                    </div>
                  </div>
                </div>

                {/* Right: Details */}
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="badge badge-violet">{scaleDisplay}</span>
                      <span className="badge bg-[#1a1a3a] text-slate-400">{figure.year}</span>
                    </div>
                    <h1 className="text-3xl font-black text-white leading-tight">{figure.name}</h1>
                    <p className="text-white/40 mt-1">{figure.character} · {figure.series}</p>
                    <p className="text-white/25 text-sm mt-1">{figure.manufacturer}</p>
                    <ShareButtons name={figure.name} label={dict.share_label} />

                    {lowestPrice !== null && (
                      <div className="mt-3 flex items-center gap-3 flex-wrap">
                        <span className="text-2xl font-black" style={{ color: "#ff2d78" }}>
                          ${(lowestPrice / 100).toFixed(2)}
                        </span>
                        {convertedLowestPrice && (
                          <span className="text-sm text-white/40">
                            {dict.currency_approx} {convertedLowestPrice}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Status Buttons */}
                  <div className="rounded-2xl border border-white/[0.06] p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <p className="text-xs text-white/25 font-medium uppercase tracking-wider mb-3">
                      {dict.fig_my_status}
                    </p>
                    <StatusButton
                      figureId={figure.id}
                      initialStatus={userStatus}
                      labels={{ have: dict.fig_status_have, wishlist: dict.fig_status_wishlist, buy: dict.fig_status_buy }}
                      buyAddsToCart={{
                        listing: cheapestListing,
                        figureName: figure.name,
                        figureSeries: figure.series,
                        figureImageUrl: figure.imageUrl ?? null,
                        toastAdded: dict.fig_added_wishlist,
                        toastAddedWithCart: dict.fig_added_wishlist_cart,
                      }}
                    />
                  </div>

                  {/* Specs Table */}
                  <div className="rounded-2xl border border-white/[0.06] overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <div className="px-4 py-3 border-b border-white/[0.06]">
                      <h2 className="font-bold text-white text-sm uppercase tracking-wider">{dict.fig_specs}</h2>
                    </div>
                    <div className="divide-y divide-white/[0.04]">
                      {specs.map((spec) => (
                        <div key={spec.label} className="flex px-4 py-2.5">
                          <span className="text-xs text-white/25 font-medium w-28 flex-shrink-0 pt-0.5">{spec.label}</span>
                          <span className="text-sm text-white/70 leading-relaxed">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* You may also like */}
            {relatedFigures.length > 0 && (
              <ScrollReveal>
                <section className="mt-16">
                  <div className="mb-6">
                    <span className="inline-block w-8 h-px bg-[#ff2d78] mb-3" />
                    <h2 className="font-black lowercase text-white text-xl tracking-tight">{dict.fig_you_may_like}</h2>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {relatedFigures.map((rel) => {
                      const relImgs = parseImages(rel.images)
                      const thumb = relImgs[0] || rel.imageUrl || null
                      return (
                        <Link key={rel.id} href={`${archiveHref.replace("/archive", "/figures")}/${rel.slug || rel.id}`} className="group block">
                          <div className="relative aspect-square rounded-xl overflow-hidden border border-white/[0.06] mb-2" style={{ background: "rgba(15,15,26,0.8)" }}>
                            {thumb ? (
                              <Image src={thumb} alt={rel.name} fill unoptimized className="object-cover object-top group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 50vw, 25vw" />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-4xl">🦇</div>
                            )}
                          </div>
                          <p className="text-sm font-bold text-white group-hover:text-[#ff2d78] transition-colors lowercase leading-tight line-clamp-1">{rel.name}</p>
                          <p className="text-xs text-white/30 mt-0.5">{rel.series}</p>
                        </Link>
                      )
                    })}
                  </div>
                </section>
              </ScrollReveal>
            )}

            {/* Related Articles */}
            {publishedArticles.length > 0 && (
              <ScrollReveal>
                <section className="mt-16">
                  <div className="mb-6">
                    <span className="inline-block w-8 h-px bg-[#ff2d78] mb-3" />
                    <h2 className="font-black lowercase text-white text-xl tracking-tight">{dict.fig_related}</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {publishedArticles.map((article) => (
                      <ArticleCard key={article.id} article={article} readMoreLabel={dict.articles_read_more} />
                    ))}
                  </div>
                </section>
              </ScrollReveal>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
