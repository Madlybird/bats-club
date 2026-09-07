import Link from "next/link"
import AddToCartButton from "@/components/AddToCartButton"
import ArtBuyNowButton from "@/components/ArtBuyNowButton"
import ArtGallery from "@/components/ArtGallery"
import ShareButtons from "@/components/ShareButtons"
import ScrollReveal from "@/components/ScrollReveal"
import TrackViewItemOnMount from "@/components/TrackViewItemOnMount"
import type { AgeGateLabels } from "@/components/AgeGate"
import type { ArtDetailRow } from "@/lib/art"
import type { ArtStrings } from "@/lib/art-i18n"

interface Props {
  item: ArtDetailRow
  strings: ArtStrings
  description: string | null
  basePath: string // "/art" | "/ru/art" | "/jp/art"
  cartHref: string
  shareLabel: string
  ageGateLabels: AgeGateLabels
}

export default function ArtDetail({ item, strings: s, description, basePath, cartHref, shareLabel, ageGateLabels }: Props) {
  const soldOut = item.stock <= 0
  const price = `$${(item.price / 100).toFixed(2)}`

  const availability = soldOut
    ? s.sold_out_note
    : item.stock === 1
      ? s.last_one
      : s.in_stock.replace("{n}", String(item.stock))

  const spec: [string, string | null | undefined][] = [
    [s.spec_type, item.type],
    [s.spec_series, item.series],
    [s.spec_year, item.year ? String(item.year) : null],
    [s.spec_size, item.size],
    [s.spec_material, item.material],
    [s.spec_edition, item.edition],
    [s.spec_availability, availability],
  ]

  const cartItem = {
    listingId: item.id,
    figureName: item.title,
    figureImageUrl: item.coverImage,
    figureSeries: item.series ?? item.type,
    price: item.price,
    condition: "New",
    kind: "art" as const,
  }

  return (
    <div className="relative min-h-screen">
      <div className="absolute top-1/4 right-1/3 w-[600px] h-[600px] rounded-full bg-[#ff2d78]/5 blur-[180px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-purple-900/6 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      <TrackViewItemOnMount listingId={item.id} figureName={item.title} price={item.price} series={item.series ?? item.type} />

      <div className="relative">
        <ScrollReveal>
          <div className="border-b border-white/[0.05]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <nav className="flex items-center gap-2 text-sm text-white/30">
                <Link href={basePath} className="hover:text-[#ff2d78] transition-colors">{s.breadcrumb}</Link>
                <span>/</span>
                <span className="text-white/60">{item.title}</span>
              </nav>
            </div>
          </div>
        </ScrollReveal>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <ScrollReveal>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <ArtGallery
                photos={item.photos}
                alt={item.title}
                isMature={item.isMature}
                ageGateLabels={ageGateLabels}
                backHref={basePath}
                zoomHint={s.zoom_hint}
              />

              <div className="space-y-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="badge bg-[#080810]/80 text-white/70 border border-white/15 text-[11px] font-semibold uppercase tracking-wide">
                      {item.type}
                    </span>
                    {soldOut && <span className="badge badge-red">{s.badge_sold_out}</span>}
                  </div>
                  <h1 className="text-3xl font-black text-white leading-tight">{item.title}</h1>
                  <p className="text-white/40 mt-1">
                    {item.artist}
                    {item.series ? ` · ${item.series}` : ""}
                  </p>
                  <ShareButtons name={item.title} label={shareLabel} />
                </div>

                <div className="rounded-2xl border border-white/[0.06] p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <span className="text-4xl font-black" style={{ color: "#ff2d78" }}>{price}</span>
                  <p className="text-xs text-white/25 mt-1">{s.shipping_note}</p>
                </div>

                <div className="space-y-2">
                  {soldOut ? (
                    <span className="block w-full py-3 text-center text-base font-bold rounded-lg text-white/40 border border-white/10">
                      {s.badge_sold_out}
                    </span>
                  ) : (
                    <>
                      <AddToCartButton
                        item={cartItem}
                        label={s.add_to_cart}
                        toastAlreadyInCart={s.already_in_cart}
                        className="w-full py-3 text-base font-bold rounded-lg text-white transition-opacity"
                        style={{ backgroundColor: "#ff2d78" }}
                      />
                      <ArtBuyNowButton
                        item={cartItem}
                        cartHref={cartHref}
                        label={s.buy_now}
                        className="w-full py-3 text-sm font-semibold rounded-lg text-white/80 border border-white/15 hover:border-white/30 transition-colors"
                      />
                    </>
                  )}
                  <Link href={cartHref} className="block text-center text-sm text-white/40 hover:text-white transition-colors pt-1">
                    {s.view_cart}
                  </Link>
                </div>

                {description && (
                  <div>
                    <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-2">{s.description}</h3>
                    <p className="text-white/60 text-sm leading-relaxed whitespace-pre-line">{description}</p>
                  </div>
                )}

                <div className="rounded-2xl border border-white/[0.06] p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <p className="text-xs text-white/25 uppercase tracking-wider mb-3">{s.details}</p>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                    {spec
                      .filter(([, v]) => v)
                      .map(([k, v]) => (
                        <div key={k} className="contents">
                          <dt className="text-white/35">{k}</dt>
                          <dd className="text-white/75">{v}</dd>
                        </div>
                      ))}
                  </dl>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  )
}
