"use client"

import Link from "next/link"
import Image from "next/image"
import StatusButton from "./StatusButton"

interface FigureCardLabels {
  figurePath: string
  forSale: string
  wishlisting: string
  noImage: string
  statusHave: string
  statusWishlist: string
  statusBuy: string
  toastAddedWishlist?: string
  toastAddedWishlistCart?: string
}

interface FigureCardProps {
  figure: {
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
    _count?: {
      listings: number
    }
    cheapestListing?: { id: string; price: number; condition: string } | null
  }
  labels: FigureCardLabels
  /** Pass true for above-the-fold cards (e.g. first 4) so the browser
   *  preloads them; everything else lazy-loads. */
  priority?: boolean
}

export default function FigureCard({ figure, labels, priority = false }: FigureCardProps) {
  const figureHref = `${labels.figurePath}/${figure.id}`
  return (
    <div className="card-hover group flex flex-col overflow-hidden">
      {/* Image */}
      <Link href={figureHref} className="block relative aspect-square overflow-hidden" style={{ background: "#0a0a0a" }}>
        {figure.imageUrl ? (
          <Image
            src={figure.imageUrl}
            alt={figure.name}
            fill
            className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 50vw, 25vw"
            {...(priority ? { priority: true } : { loading: "lazy" })}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-900/40 to-pink-900/40 flex items-center justify-center mb-3">
              <span className="text-3xl">🦇</span>
            </div>
            <p className="text-xs text-slate-600 text-center px-4">{labels.noImage}</p>
          </div>
        )}
        {/* Listing indicator */}
        {figure._count && figure._count.listings > 0 && (
          <div className="absolute bottom-2 left-2">
            <span className="badge badge-green text-[10px] backdrop-blur-sm">
              {figure._count.listings} {labels.forSale}
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <Link href={figureHref} className="block">
          <h3 className="font-semibold text-slate-100 text-sm leading-tight group-hover:text-violet-400 transition-colors line-clamp-2">
            {figure.name}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{figure.series}</p>
        </Link>

        <div className="flex items-center justify-end text-xs text-slate-500">
          <span>{figure.year}</span>
        </div>

        {/* Wishlist counter */}
        <div className="flex items-center gap-1 text-xs text-pink-500">
          <span>❤️</span>
          <span>{figure.wishlistCount} {labels.wishlisting}</span>
        </div>

        {/* Status buttons */}
        <div className="mt-auto pt-2 border-t border-[#1a1a3a]">
          <StatusButton
            figureId={figure.id}
            initialStatus={figure.userStatus}
            labels={{ have: labels.statusHave, wishlist: labels.statusWishlist, buy: labels.statusBuy }}
            buyAddsToCart={
              figure.cheapestListing
                ? {
                    listing: figure.cheapestListing,
                    figureName: figure.name,
                    figureSeries: figure.series,
                    figureImageUrl: figure.imageUrl ?? null,
                    toastAdded: labels.toastAddedWishlist ?? "Added to wishlist",
                    toastAddedWithCart: labels.toastAddedWishlistCart ?? "Added to wishlist and cart!",
                  }
                : {
                    listing: null,
                    figureName: figure.name,
                    figureSeries: figure.series,
                    figureImageUrl: figure.imageUrl ?? null,
                    toastAdded: labels.toastAddedWishlist ?? "Added to wishlist",
                    toastAddedWithCart: labels.toastAddedWishlistCart ?? "Added to wishlist and cart!",
                  }
            }
          />
        </div>
      </div>
    </div>
  )
}
