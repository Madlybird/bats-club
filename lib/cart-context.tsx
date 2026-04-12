"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"

export interface CartItem {
  listingId: string
  figureName: string
  figureImageUrl: string | null
  figureSeries: string
  price: number // in cents
  condition: string
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "quantity">) => void
  removeItem: (listingId: string) => void
  setQuantity: (listingId: string, quantity: number) => void
  clearCart: () => void
  count: number
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  setQuantity: () => {},
  clearCart: () => {},
  count: 0,
})

const STORAGE_KEY = "bats_cart"

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

  const addItem = useCallback((newItem: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.listingId === newItem.listingId)
      if (existing) {
        return prev.map((i) =>
          i.listingId === newItem.listingId ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { ...newItem, quantity: 1 }]
    })
  }, [])

  const removeItem = useCallback((listingId: string) => {
    setItems((prev) => prev.filter((i) => i.listingId !== listingId))
  }, [])

  const setQuantity = useCallback((listingId: string, quantity: number) => {
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
