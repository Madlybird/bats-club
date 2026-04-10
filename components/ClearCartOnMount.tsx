"use client"

import { useEffect } from "react"
import { useCart } from "@/lib/cart-context"

/**
 * Tiny client-only side effect: clears the local cart on mount.
 * Mounted in /order/success so that landing on the thank-you page
 * after a Stripe redirect empties the cart. Lives in its own file
 * so the parent success page can stay a server component.
 */
export default function ClearCartOnMount() {
  const { clearCart } = useCart()
  useEffect(() => {
    clearCart()
  }, [clearCart])
  return null
}
