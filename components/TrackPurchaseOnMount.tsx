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
 *
 * Retries a few times with backoff: the browser can land here before
 * the Stripe webhook has finished writing the order row, so a single
 * immediate fetch can 404 even though the payment succeeded — that
 * silently drops the purchase event since there's no later retry.
 */
const RETRY_DELAYS_MS = [1000, 2000, 3000]

export default function TrackPurchaseOnMount() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")

  useEffect(() => {
    if (!sessionId) return
    const flagKey = `purchase_tracked_${sessionId}`
    if (sessionStorage.getItem(flagKey)) return

    let cancelled = false

    const attempt = async (retriesLeft: number[]): Promise<void> => {
      try {
        const res = await fetch(`/api/orders/by-session?session_id=${encodeURIComponent(sessionId)}`)
        const order = res.ok ? await res.json() : null
        if (cancelled) return
        if (order) {
          trackPurchase({
            transactionId: sessionId,
            currency: order.currency,
            value: order.value,
            items: order.items,
          })
          sessionStorage.setItem(flagKey, "1")
          return
        }
      } catch (err) {
        console.error("[TrackPurchaseOnMount] fetch failed:", err)
      }
      if (cancelled || retriesLeft.length === 0) return
      const [delay, ...rest] = retriesLeft
      await new Promise((resolve) => setTimeout(resolve, delay))
      if (!cancelled) await attempt(rest)
    }

    attempt(RETRY_DELAYS_MS)

    return () => {
      cancelled = true
    }
  }, [sessionId])

  return null
}
