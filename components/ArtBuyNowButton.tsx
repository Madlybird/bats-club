"use client"

import { useRouter } from "next/navigation"
import { useCart, type CartItem } from "@/lib/cart-context"

// "Buy Now" for an art listing: drop it in the shared cart and jump
// straight to the cart page. Checkout / Stripe are unchanged — this is
// just a shortcut past the "keep browsing" step.
export default function ArtBuyNowButton({
  item,
  cartHref,
  label,
  className,
}: {
  item: Omit<CartItem, "quantity">
  cartHref: string
  label: string
  className?: string
}) {
  const { addItem, items } = useCart()
  const router = useRouter()

  const handleClick = () => {
    if (!items.some((i) => i.listingId === item.listingId)) addItem(item)
    router.push(cartHref)
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      {label}
    </button>
  )
}
