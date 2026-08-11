"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { trackPurchase } from "@/lib/analytics"

/**
 * Tiny client-only side effect: looks up the order by the Stripe
 * session_id in the URL and fires the GA4 `purchase` event. Mounted in
 * /order/success so the parent page can stay a server component, same
 * pattern as ClearCartOnMount.
 *
 * Guards against double-firing (refresh, browser back/forward) with a
 * sessionStorage flag keyed on session_id — GA4 would otherwise double
 * count revenue on every reload of the thank-you page.
 */
export default function TrackPurchaseOnMount() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")

  useEffect(() => {
    if (!sessionId) return
    const flagKey = `purchase_tracked_${sessionId}`
    if (sessionStorage.getItem(flagKey)) return

    fetch(`/api/orders/by-session?session_id=${encodeURIComponent(sessionId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((order) => {
        if (!order) return
        trackPurchase({
          transactionId: sessionId,
          currency: order.currency,
          value: order.value,
          items: order.items,
        })
        sessionStorage.setItem(flagKey, "1")
      })
      .catch((err) => console.error("[TrackPurchaseOnMount] failed:", err))
  }, [sessionId])

  return null
}
