"use client"

import { useState } from "react"
import { useCart, CartItem } from "@/lib/cart-context"

interface AddToCartButtonProps {
  item: Omit<CartItem, "quantity">
  className?: string
  style?: React.CSSProperties
  label?: string
  /** Localized toast shown when the listing is already in the cart. */
  toastAlreadyInCart?: string
}

function showToast(message: string) {
  if (typeof window === "undefined" || !message) return
  window.dispatchEvent(new CustomEvent("bats:toast", { detail: message }))
}

export default function AddToCartButton({
  item,
  className,
  style,
  label = "Add to Cart",
  toastAlreadyInCart = "Already in cart",
}: AddToCartButtonProps) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    const result = addItem(item)
    if (result === "already") {
      showToast(toastAlreadyInCart)
      return
    }
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <button
      onClick={handleAdd}
      className={className}
      style={style ?? { backgroundColor: "#ff2d78", color: "white", padding: "8px 16px", borderRadius: "8px", fontWeight: "bold" }}
    >
      {added ? "Added ✓" : label}
    </button>
  )
}
