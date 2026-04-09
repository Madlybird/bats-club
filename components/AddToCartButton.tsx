"use client"

import { useState } from "react"
import { useCart, CartItem } from "@/lib/cart-context"

interface AddToCartButtonProps {
  item: Omit<CartItem, "quantity">
  className?: string
  style?: React.CSSProperties
  label?: string
}

export default function AddToCartButton({
  item,
  className,
  style,
  label = "Add to Cart",
}: AddToCartButtonProps) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    addItem(item)
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
