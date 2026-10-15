"use client"

import { useEffect } from "react"
import { trackViewItem } from "@/lib/analytics"

/**
 * Fires GA4 `view_item` once per listing page load, same mount-effect
 * pattern as TrackPurchaseOnMount — keeps the parent page a server
 * component. Without this, GA4 Monetization > Item views was always
 * empty since add_to_cart was the earliest ecommerce event tracked.
 */
export default function TrackViewItemOnMount({
  listingId,
  figureName,
  price,
  series,
  category = "figure",
}: {
  listingId: string
  figureName?: string
  price: number
  series?: string
  /** "figure" (shop listings) | "art" */
  category?: string
}) {
  useEffect(() => {
    if (!figureName) return
    trackViewItem({ id: listingId, name: figureName, price, variant: series, category })
    // Fire once on mount only — not on every re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId])

  return null
}
