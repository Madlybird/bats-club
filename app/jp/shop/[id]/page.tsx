import { supabaseAdmin } from "@/lib/supabase"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { notFound } from "next/navigation"
import Link from "next/link"
import AddToCartButton from "@/components/AddToCartButton"
import BatsOverlay from "@/components/BatsOverlay"
import ScrollReveal from "@/components/ScrollReveal"
import ShareButtons from "@/components/ShareButtons"
import PhotoCarousel from "@/components/PhotoCarousel"
import { jp } from "@/lib/dict"
import { getRates, convertPrice } from "@/lib/currency"
import { Metadata } from "next"

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: listing } = await supabaseAdmin
    .from("listings")
    .select("price, figure:figures(name)")
    .eq("id", params.id)
    .single()
  if (!listing) return { title: "Listing Not Found" }
  return { title: `${(listing.figure as any)?.name} — $${(listing.price / 100).toFixed(2)} | Bats Club` }
}

const conditionColors: Record<string, string> = {
  Mint: "badge-green", "Near Mint": "badge-blue",
  Good: "badge-violet", Fair: "badge-yellow", Poor: "badge-red",
}

function parseImages(raw: unknown): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.filter((u): u is string => typeof u === "string")
  if (typeof raw === "string") {
    try { const p = JSON.parse(raw); return Array.isArray(p) ? p.filter((u): u is string => typeof u === "string") : [] }
    catch { return [] }
  }
  return []
}

export default async function ListingDetailPageJp({ params }: Props) {
  const session = await getServerSession(authOptions)
  const dict = jp

  const { data: listing } = await supabaseAdmin
    .from("listings")
    .select(`
      id, price, condition, photos, description, active,
      figure:figures(id, name, series, character, scale, imageUrl:image_url, images)
    `)
    .eq("id", params.id)
    .single()

  if (!listing || !listing.active) notFound()

  const figure = listing.figure as any
  const photos = parseImages(listing.photos)
  const figureImages = parseImages(figure?.images)
  const displayImages: string[] = photos.length > 0
    ? photos
    : figureImages.length > 0
    ? figureImages
    : figure?.imageUrl
    ? [figure.imageUrl]
    : []

  const rates = await getRates()
  const convertedPrice = convertPrice(listing.price, "jp", rates)

  const conditionDisplay = dict[`shop_condition_${listing.condition.toLowerCase().replace(" ", "_")}` as keyof typeof dict] as string || listing.condition

  return (
    <div className="relative min-h-screen">
      <BatsOverlay />
      <div className="absolute top-1/4 right-1/3 w-[600px] h-[600px] rounded-full bg-[#ff2d78]/5 blur-[180px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-purple-900/6 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      <div className="relative">
        <ScrollReveal>
          <div className="border-b border-white/[0.05]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <nav className="flex items-center gap-2 text-sm text-white/30">
                <Link href="/jp/shop" className="hover:text-[#ff2d78] transition-colors">{dict.shop_heading}</Link>
                <span>/</span>
                <span className="text-white/60">{figure?.name}</span>
              </nav>
            </div>
          </div>
        </ScrollReveal>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <ScrollReveal>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-3">
                <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/[0.06]" style={{ background: "#0a0a0a" }}>
                  <PhotoCarousel images={displayImages} alt={figure?.name ?? "Figure"} priority />
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`badge ${conditionColors[listing.condition] || "badge-violet"}`}>{conditionDisplay}</span>
                    <span className="badge badge-violet">{figure?.scale}</span>
                  </div>
                  <h1 className="text-3xl font-black text-white">{figure?.name}</h1>
                  <p className="text-white/40 mt-1">{figure?.character} · {figure?.series}</p>
                  <ShareButtons name={figure?.name} label={dict.share_label} />
                </div>
                <div className="rounded-2xl border border-white/[0.06] p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="text-4xl font-black" style={{ color: "#ff2d78" }}>${(listing.price / 100).toFixed(2)}</span>
                    {convertedPrice && (
                      <span className="text-lg text-white/50">{dict.currency_approx} {convertedPrice}</span>
                    )}
                  </div>
                  <p className="text-xs text-white/25 mt-1">{dict.shop_shipping_note}</p>
                </div>
                {listing.description && (
                  <div>
                    <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-2">{dict.shop_description}</h3>
                    <p className="text-white/60 text-sm leading-relaxed">{listing.description}</p>
                  </div>
                )}
                <div className="rounded-2xl border border-white/[0.06] p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <p className="text-xs text-white/25 uppercase tracking-wider mb-2">{dict.shop_figure_info}</p>
                  <Link href={`/jp/figures/${figure?.id}`} className="text-sm font-medium transition-colors hover:opacity-80" style={{ color: "#ff2d78" }}>
                    {dict.shop_view_figure}
                  </Link>
                </div>
                <div className="space-y-2">
                  <AddToCartButton
                    item={{
                      listingId: listing.id,
                      figureName: figure?.name,
                      figureImageUrl: figure?.imageUrl ?? null,
                      figureSeries: figure?.series,
                      price: listing.price,
                      condition: listing.condition,
                    }}
                    label={dict.shop_add_to_cart}
                    className="w-full py-3 text-base font-bold rounded-lg text-white transition-opacity"
                    style={{ backgroundColor: "#ff2d78" }}
                  />
                  <Link href="/cart" className="block text-center text-sm text-white/40 hover:text-white transition-colors">{dict.shop_view_cart}</Link>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  )
}
