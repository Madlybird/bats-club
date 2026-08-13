"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"

/**
 * Renders Google's Customer Reviews opt-in modal on the order confirmation
 * page, per https://merchants.google.com/mc/customerreviews — Google emails
 * the buyer a review survey a few days after the estimated delivery date,
 * but only if they check the opt-in box shown here. New orders only: no
 * backend job retries this for past checkouts, since Google's own policy
 * requires the opt-in to be shown live to the buyer right after checkout,
 * not reconstructed later.
 *
 * Same session_id lookup + retry-with-backoff + sessionStorage dedupe
 * pattern as TrackPurchaseOnMount: the browser can land here before the
 * Stripe webhook has finished writing the order row, and a refresh of the
 * thank-you page shouldn't re-render the modal.
 */
declare global {
  interface Window {
    renderOptIn?: () => void
    gapi?: {
      load: (lib: string, cb: () => void) => void
      surveyoptin?: { render: (opts: Record<string, unknown>) => void }
    }
  }
}

const MERCHANT_ID = 5770213477
const RETRY_DELAYS_MS = [1000, 2000, 3000]

type OrderForOptIn = {
  email: string | null
  deliveryCountry: string | null
  estimatedDeliveryDate: string | null
}

function renderWidget(sessionId: string, order: OrderForOptIn) {
  window.renderOptIn = function () {
    window.gapi?.load("surveyoptin", function () {
      window.gapi?.surveyoptin?.render({
        merchant_id: MERCHANT_ID,
        order_id: sessionId,
        email: order.email,
        delivery_country: order.deliveryCountry,
        estimated_delivery_date: order.estimatedDeliveryDate,
      })
    })
  }

  if (document.getElementById("gcr-optin-script")) {
    window.renderOptIn()
    return
  }
  const script = document.createElement("script")
  script.id = "gcr-optin-script"
  script.src = "https://apis.google.com/js/platform.js?onload=renderOptIn"
  script.async = true
  script.defer = true
  document.body.appendChild(script)
}

export default function GoogleCustomerReviewsOptIn() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")

  useEffect(() => {
    if (!sessionId) return
    const flagKey = `gcr_optin_shown_${sessionId}`
    if (sessionStorage.getItem(flagKey)) return

    let cancelled = false

    const attempt = async (retriesLeft: number[]): Promise<void> => {
      try {
        const res = await fetch(`/api/orders/by-session?session_id=${encodeURIComponent(sessionId)}`)
        const order: OrderForOptIn | null = res.ok ? await res.json() : null
        if (cancelled) return
        if (order && order.email && order.deliveryCountry && order.estimatedDeliveryDate) {
          renderWidget(sessionId, order)
          sessionStorage.setItem(flagKey, "1")
          return
        }
      } catch (err) {
        console.error("[GoogleCustomerReviewsOptIn] fetch failed:", err)
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
