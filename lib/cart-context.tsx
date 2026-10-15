"use client"

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react"
import { trackAddToCart, trackRemoveFromCart, type TrackItem } from "@/lib/analytics"

export interface CartItem {
  listingId: string
  figureName: string
  figureImageUrl: string | null
  figureSeries: string
  price: number // in cents
  condition: string
  quantity: number
  /** "art" for /art listings, undefined/"figure" for figure listings. Used
   *  for GA4 item_category and to pick the shipping model (figures use the
   *  tiered per-order table, art is priced by ePacket weight). */
  kind?: "figure" | "art"
  /** Art type ("Poster" | "Zine" | …) — only set for art listings. Drives the
   *  per-type shipping weight and the per-order quantity cap. */
  artType?: string
  /** Digital download (PDF) — no shipping, quantity locked to 1. */
  isDigital?: boolean
}

export type AddItemResult = "added" | "already"

interface CartContextType {
  items: CartItem[]
  /** `source` tags the add_to_cart event with where the add came from
   *  ("card", "detail", "buy_now", "quick_buy", "status_buy"). */
  addItem: (item: Omit<CartItem, "quantity">, source?: string) => AddItemResult
  removeItem: (listingId: string) => void
  setQuantity: (listingId: string, quantity: number) => void
  clearCart: () => void
  count: number
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => "added",
  removeItem: () => {},
  setQuantity: () => {},
  clearCart: () => {},
  count: 0,
})

const STORAGE_KEY = "bats_cart"

function toTrackItem(i: Omit<CartItem, "quantity">, quantity = 1): TrackItem {
  return {
    id: i.listingId,
    name: i.figureName,
    price: i.price,
    category: i.kind ?? "figure",
    variant: i.kind === "art" ? i.artType : i.figureSeries,
    quantity,
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setItems(JSON.parse(stored))
    } catch {}
    setHydrated(true)
  }, [])

  // Persist to localStorage on every change (after hydration)
  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items, hydrated])

  // Every listing has stock = 1, so adding a duplicate is a no-op — we
  // return "already" so the caller can show a toast instead of silently
  // bumping quantity past stock.
  // Latest items for the analytics side of removeItem / setQuantity, which
  // stay referentially stable (no `items` dependency).
  const itemsRef = useRef(items)
  useEffect(() => {
    itemsRef.current = items
  }, [items])

  const addItem = useCallback((newItem: Omit<CartItem, "quantity">, source?: string): AddItemResult => {
    if (items.some((i) => i.listingId === newItem.listingId)) return "already"
    setItems((prev) =>
      prev.some((i) => i.listingId === newItem.listingId)
        ? prev
        : [...prev, { ...newItem, quantity: 1 }]
    )
    trackAddToCart(toTrackItem(newItem), source)
    return "added"
  }, [items])

  const removeItem = useCallback((listingId: string) => {
    const gone = itemsRef.current.find((i) => i.listingId === listingId)
    if (gone) trackRemoveFromCart(toTrackItem(gone, gone.quantity))
    setItems((prev) => prev.filter((i) => i.listingId !== listingId))
  }, [])

  const setQuantity = useCallback((listingId: string, quantity: number) => {
    const cur = itemsRef.current.find((i) => i.listingId === listingId)
    if (cur) {
      const next = Math.max(quantity, 0)
      const delta = next - cur.quantity
      if (delta > 0) trackAddToCart(toTrackItem(cur, delta), "cart_stepper")
      if (delta < 0) trackRemoveFromCart(toTrackItem(cur, -delta))
    }
    if (quantity < 1) {
      setItems((prev) => prev.filter((i) => i.listingId !== listingId))
      return
    }
    setItems((prev) =>
      prev.map((i) => (i.listingId === listingId ? { ...i, quantity } : i))
    )
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const count = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, setQuantity, clearCart, count }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
