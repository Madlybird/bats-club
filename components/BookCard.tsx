import Link from "next/link"
import Image from "@/components/SiteImage"
import AddToCartButton from "@/components/AddToCartButton"
import { MatureBlur, type AgeGateLabels } from "@/components/AgeGate"
import type { BookListRow } from "@/lib/books"
import type { CartItem } from "@/lib/cart-context"

export interface BookCardLabels {
  addToCart: string
  alreadyInCart: string
  badgeNew: string
  badgeSoldOut: string
  conditionNames: Record<string, string>
}

const NEW_WINDOW_MS = 14 * 24 * 60 * 60 * 1000

function isNew(createdAt: string | null): boolean {
  if (!createdAt) return false
  const t = Date.parse(createdAt)
  return !Number.isNaN(t) && Date.now() - t < NEW_WINDOW_MS
}

export function bookCartItem(item: BookListRow): Omit<CartItem, "quantity"> {
  return {
    listingId: item.id,
    figureName: item.title,
    figureImageUrl: item.coverImage,
    figureSeries: [item.type, item.author || item.series].filter(Boolean).join(" · "),
    price: item.price,
    condition: item.condition,
    kind: "book",
    bookType: item.type,
    weightG: item.weightG,
  }
}

interface Props {
  item: BookListRow
  labels: BookCardLabels
  ageGateLabels: AgeGateLabels
  basePath?: string // "/books" | "/ru/books" | "/jp/books"
  priority?: boolean
}

export default function BookCard({ item, labels, ageGateLabels, basePath = "/books", priority = false }: Props) {
  const href = `${basePath}/${item.id}`
  const soldOut = item.stock <= 0
  const fresh = !soldOut && isNew(item.createdAt)
  const subtitle = [item.author, item.series].filter(Boolean).join(" · ") || item.publisher || item.type

  return (
    <div
      className="card-hover group flex flex-col overflow-hidden h-full"
      data-item-id={item.id}
      data-item-name={item.title}
      data-item-cat="book"
      data-item-variant={item.type}
      data-item-price={item.price}
    >
      <Link
        href={href}
        data-track="card_image"
        className="block relative overflow-hidden flex-shrink-0"
        style={{ aspectRatio: "3 / 4", background: "#0a0a0a" }}
      >
        <MatureBlur isMature={item.isMature} labels={ageGateLabels}>
          {item.coverImage ? (
            <Image
              src={item.coverImage}
              alt={item.title}
              fill
              className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              {...(priority ? { priority: true } : { loading: "lazy" })}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl opacity-20">📚</span>
            </div>
          )}
        </MatureBlur>

        <div className="absolute top-2 left-2 flex gap-1">
          <span className="badge bg-[#080810]/80 text-white/70 border border-white/15 backdrop-blur-sm text-[10px] font-semibold uppercase tracking-wide">
            {item.type}
          </span>
          {fresh && (
            <span className="badge bg-[#ff2d78]/90 text-white border border-transparent text-[10px] font-bold uppercase">
              {labels.badgeNew}
            </span>
          )}
        </div>

        <div className="absolute bottom-2 right-2">
          <span className="badge bg-[#080810]/80 text-violet-300 border border-violet-700/40 backdrop-blur-sm text-[11px] font-bold">
            ${(item.price / 100).toFixed(2)}
          </span>
        </div>

        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55">
            <span className="badge bg-black/80 text-white border border-white/25 text-[11px] font-bold uppercase tracking-wide">
              {labels.badgeSoldOut}
            </span>
          </div>
        )}
      </Link>

      <div className="p-3 flex flex-col flex-1">
        <div className="min-h-[46px]">
          <Link href={href} data-track="card_title" className="block">
            <h3 className="font-semibold text-white/90 text-sm leading-tight line-clamp-2 group-hover:text-[#ff2d78] transition-colors">
              {item.title}
            </h3>
            <p className="text-xs text-white/30 mt-0.5 truncate">{subtitle}</p>
          </Link>
        </div>

        <p className="text-[11px] text-white/35 mt-1">
          {labels.conditionNames[item.condition] ?? item.condition}
          {item.includes.length > 0 && <span className="text-white/20"> · {item.includes.join(", ")}</span>}
        </p>

        <div className="mt-auto pt-2">
          {soldOut ? (
            <span className="block w-full text-center text-sm py-2 rounded-lg font-bold text-white/40 border border-white/10">
              {labels.badgeSoldOut}
            </span>
          ) : (
            <AddToCartButton
              item={bookCartItem(item)}
              label={labels.addToCart}
              toastAlreadyInCart={labels.alreadyInCart}
              className="w-full text-center text-sm py-2 rounded-lg font-bold text-white transition-colors"
              style={{ backgroundColor: "#ff2d78" } as React.CSSProperties}
            />
          )}
        </div>
      </div>
    </div>
  )
}
