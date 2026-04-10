"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useCart } from "@/lib/cart-context"

interface Props {
  figureId: string
  figureName: string
  figureSeries: string
  figureImageUrl: string | null
  /** Cheapest active listing for this figure, if any. */
  cheapestListing: { id: string; price: number; condition: string } | null
  /** Visible button text — pass a localized "Want to Buy" / "Хочу купить" / "買いたい". */
  label: string
  toastAdded: string
  toastAddedWithCart: string
  className?: string
  /** Optional inline styles, e.g. for absolute positioning over a card image. */
  style?: React.CSSProperties
}

function showToast(message: string) {
  if (typeof window === "undefined" || !message) return
  window.dispatchEvent(new CustomEvent("bats:toast", { detail: message }))
}

/**
 * One-button "Want to Buy" CTA. Same side effects as StatusButton's
 * BUY click — marks the figure as BUY in user_figures, drops the
 * cheapest active listing into the local cart (if any), and shows a
 * localized toast. Used in places that don't want the full 3-button
 * StatusButton trio (e.g. homepage recent figures).
 */
export default function BuyToCartButton({
  figureId,
  figureName,
  figureSeries,
  figureImageUrl,
  cheapestListing,
  label,
  toastAdded,
  toastAddedWithCart,
  className,
  style,
}: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const { addItem, items: cartItems } = useCart()
  const [loading, setLoading] = useState(false)

  const handleClick = async (e: React.MouseEvent) => {
    // Recent-figures cards on the homepage wrap the whole tile in a
    // <Link>; stop the click so we don't navigate when the user
    // wanted to add to cart.
    e.preventDefault()
    e.stopPropagation()

    if (!session) {
      router.push("/login")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/user-figures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ figureId, status: "BUY" }),
      })
      if (!res.ok) return

      if (cheapestListing) {
        const alreadyInCart = cartItems.some((i) => i.listingId === cheapestListing.id)
        if (!alreadyInCart) {
          addItem({
            listingId: cheapestListing.id,
            figureName,
            figureImageUrl,
            figureSeries,
            price: cheapestListing.price,
            condition: cheapestListing.condition,
          })
        }
        showToast(toastAddedWithCart)
      } else {
        showToast(toastAdded)
      }
    } catch (err) {
      console.error("BuyToCartButton failed:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={
        className ??
        "inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full text-white shadow-md backdrop-blur-sm transition-opacity disabled:opacity-50"
      }
      style={
        style ?? {
          background: "linear-gradient(135deg, #ff2d78, #7c3aed)",
        }
      }
    >
      <span aria-hidden="true">🛒</span>
      <span>{label}</span>
    </button>
  )
}
