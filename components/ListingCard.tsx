import Link from "next/link"
import Image from "next/image"
import AddToCartButton from "@/components/AddToCartButton"

interface ListingCardLabels {
  addToCart?: string
  conditions?: Record<string, string>
}

interface ListingCardProps {
  listing: {
    id: string
    price: number
    condition: string
    description?: string | null
    photos: string
    figure: {
      id: string
      name: string
      series: string
      character: string
      imageUrl?: string | null
      scale: string
    }
  }
  labels?: ListingCardLabels
  basePath?: string
}

const conditionColors: Record<string, string> = {
  Mint: "badge-green",
  "Near Mint": "badge-blue",
  Good: "badge-violet",
  Fair: "badge-yellow",
  Poor: "badge-red",
}

export default function ListingCard({ listing, labels, basePath = "/shop" }: ListingCardProps) {
  const addToCartLabel = labels?.addToCart ?? "Add to Cart"
  const conditionDisplay = labels?.conditions?.[listing.condition] ?? listing.condition
  const listingHref = `${basePath}/${listing.id}`

  const photos = (() => {
    try { return JSON.parse(listing.photos) as string[] }
    catch { return [] }
  })()

  const displayImage = photos[0] || listing.figure.imageUrl

  return (
    <div className="card-hover group flex flex-col overflow-hidden h-full">
      {/* Image */}
      <Link href={listingHref} className="block relative aspect-square overflow-hidden flex-shrink-0" style={{ background: "#0a0a0a" }}>
        {displayImage ? (
          <Image
            src={displayImage}
            alt={listing.figure.name}
            fill
            className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl opacity-20">🦇</span>
          </div>
        )}
        {/* Condition badge */}
        <div className="absolute top-2 left-2">
          <span className={`badge ${conditionColors[listing.condition] || "badge-violet"} text-[10px] backdrop-blur-sm`}>
            {conditionDisplay}
          </span>
        </div>
        {/* Price badge */}
        <div className="absolute bottom-2 right-2">
          <span className="badge bg-[#080810]/80 text-violet-300 border border-violet-700/40 backdrop-blur-sm text-[11px] font-bold">
            ${(listing.price / 100).toFixed(2)}
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1">
        <div className="h-[52px] overflow-hidden">
          <Link href={listingHref} className="block">
            <h3 className="font-semibold text-white/90 text-sm leading-tight group-hover:text-[#ff2d78] transition-colors line-clamp-2">
              {listing.figure.name}
            </h3>
            <p className="text-xs text-white/30 mt-0.5 truncate">{listing.figure.series}</p>
          </Link>
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
            className="w-full text-center text-sm py-2 rounded-lg font-bold text-white transition-colors"
            style={{ backgroundColor: "#ff2d78" } as React.CSSProperties}
          />
        </div>
      </div>
    </div>
  )
}
