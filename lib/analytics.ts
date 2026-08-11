// Thin wrapper around the gtag.js snippet already loaded in app/layout.tsx.
// Fires standard GA4 ecommerce events so the funnel (page_view →
// add_to_cart → begin_checkout → purchase, fired client-side from
// /order/success via TrackPurchaseOnMount) is visible in GA4 Reports >
// Monetization instead of being a total blind spot.

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || !window.gtag) return
  window.gtag("event", name, params)
}

export function trackViewItem(item: { listingId: string; figureName: string; price: number; series?: string }) {
  trackEvent("view_item", {
    currency: "USD",
    value: item.price / 100,
    items: [{ item_id: item.listingId, item_name: item.figureName, item_category: item.series, price: item.price / 100, quantity: 1 }],
  })
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

export function trackPurchase(order: {
  transactionId: string
  currency: string
  value: number
  items: { item_id: string; item_name: string; price: number; quantity: number }[]
}) {
  trackEvent("purchase", {
    transaction_id: order.transactionId,
    currency: order.currency,
    value: order.value,
    items: order.items,
  })
}
