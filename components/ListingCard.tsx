import Image from "next/image"
import AddToCartButton from "@/components/AddToCartButton"
import { AgeGateLink, AgeGateTextLink, type AgeGateLabels } from "@/components/AgeGate"

interface ListingCardLabels {
  addToCart?: string
  alreadyInCart?: string
}

interface ListingCardProps {
  listing: {
    id: string
    price: number
    condition: string
    description?: string | null
    photos: string | string[]
    figure: {
      id: string
      name: string
      series: string
      character: string
      imageUrl?: string | null
      scale: string
      isMature?: boolean | null
    }
  }
  labels?: ListingCardLabels
  ageGateLabels: AgeGateLabels
  basePath?: string
  /** Pass true for above-the-fold cards (e.g. first 4) so the browser
   *  preloads them; everything else lazy-loads. */
  priority?: boolean
}

export default function ListingCard({ listing, labels, ageGateLabels, basePath = "/shop", priority = false }: ListingCardProps) {
  const addToCartLabel = labels?.addToCart ?? "Add to Cart"
  const alreadyInCartLabel = labels?.alreadyInCart ?? "Already in cart"
  const listingHref = `${basePath}/${listing.id}`

  // `photos` is a jsonb column — Supabase already returns it as a
  // native array. Only fall back to JSON.parse for the (unlikely)
  // case it comes back as a string, mirroring app/shop/[id]/page.tsx.
  const photos = (() => {
    const raw = listing.photos as unknown
    if (Array.isArray(raw)) return raw.filter((u): u is string => typeof u === "string")
    if (typeof raw === "string") {
      try { const p = JSON.parse(raw); return Array.isArray(p) ? p.filter((u): u is string => typeof u === "string") : [] }
      catch { return [] }
    }
    return []
  })()

  const displayImage = photos[0] || listing.figure.imageUrl
  const isMature = !!listing.figure.isMature

  return (
    <div className="card-hover group flex flex-col overflow-hidden h-full">
      {/* Image */}
      <AgeGateLink
        isMature={isMature}
        href={listingHref}
        labels={ageGateLabels}
        className="block relative aspect-square overflow-hidden flex-shrink-0"
        style={{ background: "#0a0a0a" }}
        overlay={
          <div className="absolute bottom-2 right-2">
            <span className="badge bg-[#080810]/80 text-violet-300 border border-violet-700/40 backdrop-blur-sm text-[11px] font-bold">
              ${(listing.price / 100).toFixed(2)}
            </span>
          </div>
        }
      >
        {displayImage ? (
          <Image
            src={displayImage}
            alt={listing.figure.name}
            fill
            // See FigureCard: bypass the Vercel image optimizer and
            // pull the JPG straight from Supabase Storage.
            unoptimized
            className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 50vw, 25vw"
            {...(priority ? { priority: true } : { loading: "lazy" })}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl opacity-20">🦇</span>
          </div>
        )}
      </AgeGateLink>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1">
        <div className="h-[52px] overflow-hidden">
          <AgeGateTextLink isMature={isMature} href={listingHref} labels={ageGateLabels} className="block">
            <h3 className="font-semibold text-white/90 text-sm leading-tight group-hover:text-[#ff2d78] transition-colors line-clamp-2">
              {listing.figure.name}
            </h3>
            <p className="text-xs text-white/30 mt-0.5 truncate">{listing.figure.series}</p>
          </AgeGateTextLink>
        </div>

        <div className="mt-2">
          <AddToCartButton
            item={{
              listingId: listing.id,
              figureName: listing.figure.name,
              figureImageUrl: listing.figure.imageUrl ?? null,
              figureSeries: listing.figure.series,
              price: listing.price,
              condition: listing.condition,
            }}
            label={addToCartLabel}
            toastAlreadyInCart={alreadyInCartLabel}
            className="w-full text-center text-sm py-2 rounded-lg font-bold text-white transition-colors"
            style={{ backgroundColor: "#ff2d78" } as React.CSSProperties}
          />
        </div>
      </div>
    </div>
  )
}
