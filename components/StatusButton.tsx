"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useCart } from "@/lib/cart-context"
import {
  useUserFigureStatus,
  useUserFiguresActions,
} from "@/lib/user-figures-context"

interface StatusLabels {
  have: string
  wishlist: string
  buy: string
}

interface BuyAddsToCart {
  /** Cheapest active listing for this figure, or null if none. */
  listing: { id: string; price: number; condition: string } | null
  figureName: string
  figureSeries: string
  figureImageUrl: string | null
  /** Toast shown when no listing exists (BUY only marks wishlist). */
  toastAdded: string
  /** Toast shown when a listing exists and was added to the cart too. */
  toastAddedWithCart: string
}

interface StatusButtonProps {
  figureId: string
  initialStatus?: string | null
  labels?: StatusLabels
  /** When provided, clicking BUY also adds the cheapest listing (if any)
   *  to the cart and shows a localized toast. Used by archive cards. */
  buyAddsToCart?: BuyAddsToCart
}

const DEFAULT_LABELS: StatusLabels = {
  have: "Have It",
  wishlist: "Wishlist",
  buy: "Add to Cart",
}

function showToast(message: string) {
  if (typeof window === "undefined" || !message) return
  window.dispatchEvent(new CustomEvent("bats:toast", { detail: message }))
}

export default function StatusButton({ figureId, initialStatus, labels = DEFAULT_LABELS, buyAddsToCart }: StatusButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { addItem, items: cartItems } = useCart()
  // Status comes from UserFiguresProvider, which fetches once per
  // authenticated session and shares the result across every card on
  // the page. initialStatus is a server-side fallback for pages that
  // still pass one (the dedicated figure page, profile page).
  const fromContext = useUserFigureStatus(figureId)
  const { setStatus: setContextStatus } = useUserFiguresActions()
  const [localStatus, setLocalStatus] = useState<string | null>(initialStatus || null)
  const [loading, setLoading] = useState(false)
  const currentStatus = fromContext ?? localStatus
  const setCurrentStatus = (status: string | null) => {
    setLocalStatus(status)
    setContextStatus(figureId, status)
  }

  const statuses = [
    { value: "BUY",      label: labels.buy,       icon: "🛒", activeClass: "bg-violet-700 border-violet-600 text-white" },
    { value: "WISHLIST", label: labels.wishlist,  icon: "❤️", activeClass: "bg-pink-700 border-pink-600 text-white" },
    { value: "HAVE",     label: labels.have,     icon: "✓",  activeClass: "bg-emerald-700 border-emerald-600 text-white" },
  ]

  const handleStatus = async (status: string) => {
    if (!session) {
      router.push("/login")
      return
    }

    setLoading(true)
    try {
      if (currentStatus === status) {
        const res = await fetch("/api/user-figures", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ figureId }),
        })
        if (res.ok) setCurrentStatus(null)
      } else {
        const res = await fetch("/api/user-figures", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ figureId, status }),
        })
        if (res.ok) {
          setCurrentStatus(status)

          // BUY-click side effect: if the figure has an active listing,
          // also drop it in the cart so the user can check out in one
          // step. Falls back to a plain wishlist toast otherwise.
          if (status === "BUY" && buyAddsToCart) {
            const listing = buyAddsToCart.listing
            if (listing) {
              const alreadyInCart = cartItems.some((i) => i.listingId === listing.id)
              if (!alreadyInCart) {
                addItem({
                  listingId: listing.id,
                  figureName: buyAddsToCart.figureName,
                  figureImageUrl: buyAddsToCart.figureImageUrl,
                  figureSeries: buyAddsToCart.figureSeries,
                  price: listing.price,
                  condition: listing.condition,
                })
              }
              showToast(buyAddsToCart.toastAddedWithCart)
            } else {
              showToast(buyAddsToCart.toastAdded)
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to update status:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-1.5 flex-wrap">
      {statuses.map((s) => {
        const isActive = currentStatus === s.value
        return (
          <button
            key={s.value}
            onClick={() => handleStatus(s.value)}
            disabled={loading}
            className={`
              flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all duration-200
              ${isActive
                ? s.activeClass
                : "bg-[#0a0a12] border-[#1a1a3a] text-slate-400 hover:border-violet-700/50 hover:text-slate-200"
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <span>{s.icon}</span>
            <span>{s.label}</span>
          </button>
        )
      })}
    </div>
  )
}
