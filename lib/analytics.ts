// Thin wrapper around the gtag.js snippet already loaded in app/layout.tsx.
// Fires standard GA4 ecommerce events so the funnel (product view already
// tracked via page_view → add_to_cart → begin_checkout → purchase via the
// Stripe webhook) is visible in GA4 Reports > Engagement > Events instead
// of being a total blind spot.

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || !window.gtag) return
  window.gtag("event", name, params)
}

export function trackAddToCart(item: { listingId: string; figureName: string; price: number }) {
  trackEvent("add_to_cart", {
    currency: "USD",
    value: item.price / 100,
    items: [{ item_id: item.listingId, item_name: item.figureName, price: item.price / 100, quantity: 1 }],
  })
}

export function trackProceedToCheckout(valueCents: number, itemCount: number) {
  trackEvent("proceed_to_checkout", { currency: "USD", value: valueCents / 100, items_count: itemCount })
}

export function trackBeginCheckout(valueCents: number, itemCount: number) {
  trackEvent("begin_checkout", { currency: "USD", value: valueCents / 100, items_count: itemCount })
}
