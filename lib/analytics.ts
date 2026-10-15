// Single entry point for site analytics. Every event goes to two sinks:
//
//  - GA4 (gtag.js, loaded in app/layout.tsx) — full params, ecommerce
//    funnel (view_item_list → select_item → view_item → add_to_cart →
//    begin_checkout → purchase) and promotion reports. Subject to the
//    EU/UK consent default in layout.tsx.
//  - Vercel Web Analytics custom events — cookieless, so it also counts
//    visitors who never answer the consent banner. Pro plan keeps only
//    2 properties per event, so each call picks the two that matter.
//
// Clicks, impressions, scroll depth and search/sort inputs are collected
// generically by components/AnalyticsTracker.tsx from data-* attributes
// (see the comment at the top of that file); this module holds the
// typed helpers it and the components call.

import { track as vercelTrack } from "@vercel/analytics"

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

type Scalar = string | number | boolean | null
type VercelProps = Record<string, Scalar>

// Params Vercel gets by default, in priority order (first 2 present win).
const VERCEL_KEYS = [
  "area",
  "label",
  "item_name",
  "promotion_name",
  "experiment_id",
  "variant_id",
  "item_category",
  "search_term",
  "source",
  "method",
  "page_type",
]

export function pageType(pathname: string): string {
  const p = pathname.replace(/^\/(ru|jp)(?=\/|$)/, "") || "/"
  if (p === "/") return "home"
  const [first, second] = p.split("/").filter(Boolean)
  const detail: Record<string, string> = {
    art: "art_item",
    shop: "shop_item",
    figures: "figure",
    articles: "article",
  }
  if (second && detail[first]) return detail[first]
  return first
}

export function trackEvent(
  name: string,
  params: Record<string, unknown> = {},
  opts: { vercel?: VercelProps | false } = {},
) {
  if (typeof window === "undefined") return
  if (window.location.pathname.startsWith("/admin")) return
  const full = { page_type: pageType(window.location.pathname), ...params }
  if (process.env.NODE_ENV !== "production") {
    // Local dev: log instead of polluting GA4 with localhost traffic.
    console.debug("[analytics]", name, JSON.stringify(full))
    return
  }
  window.gtag?.("event", name, full)

  if (opts.vercel === false) return
  let props: VercelProps = {}
  if (opts.vercel) {
    props = opts.vercel
  } else {
    for (const k of VERCEL_KEYS) {
      const v = full[k as keyof typeof full]
      if (v === undefined || v === null || typeof v === "object") continue
      props[k] = String(v).slice(0, 255)
      if (Object.keys(props).length === 2) break
    }
  }
  try {
    vercelTrack(name, props)
  } catch {
    /* analytics must never break the page */
  }
}

// ── Ecommerce ────────────────────────────────────────────────────────────

export interface TrackItem {
  id: string
  name: string
  /** cents */
  price?: number
  /** "art" | "figure" | "figure_archive" | "article" */
  category?: string
  /** series (figures) or art type */
  variant?: string
  quantity?: number
  index?: number
  listName?: string
}

function gaItem(i: TrackItem) {
  return {
    item_id: i.id,
    item_name: i.name,
    item_category: i.category,
    item_category2: i.variant,
    price: i.price != null ? i.price / 100 : undefined,
    quantity: i.quantity ?? 1,
    index: i.index,
    item_list_name: i.listName,
  }
}

function itemsValue(items: TrackItem[]) {
  return items.reduce((s, i) => s + (i.price ?? 0) * (i.quantity ?? 1), 0) / 100
}

export function trackViewItem(item: TrackItem) {
  trackEvent("view_item", {
    currency: "USD",
    value: itemsValue([item]),
    item_name: item.name,
    item_category: item.category,
    items: [gaItem(item)],
  })
}

/** GA4 only — impressions are high-volume and Vercel has no list report. */
export function trackViewItemList(listName: string, items: TrackItem[]) {
  if (items.length === 0) return
  trackEvent(
    "view_item_list",
    { item_list_name: listName, items: items.map(gaItem) },
    { vercel: false },
  )
}

export function trackSelectItem(listName: string, item: TrackItem) {
  trackEvent("select_item", {
    item_list_name: listName,
    item_name: item.name,
    item_category: item.category,
    items: [gaItem({ ...item, listName })],
  }, { vercel: { item_name: item.name, area: listName } })
}

/** Fired from lib/cart-context so every add path (card, detail, buy now,
 *  status button, quick-buy) is counted exactly once. */
export function trackAddToCart(item: TrackItem, source?: string) {
  trackEvent("add_to_cart", {
    currency: "USD",
    value: itemsValue([item]),
    item_name: item.name,
    item_category: item.category,
    source,
    items: [gaItem(item)],
  })
}

export function trackRemoveFromCart(item: TrackItem) {
  trackEvent("remove_from_cart", {
    currency: "USD",
    value: itemsValue([item]),
    item_name: item.name,
    item_category: item.category,
    items: [gaItem(item)],
  })
}

export function trackViewCart(items: TrackItem[]) {
  trackEvent("view_cart", {
    currency: "USD",
    value: itemsValue(items),
    items: items.map(gaItem),
  }, { vercel: { items_count: items.length } })
}

export function trackProceedToCheckout(valueCents: number, itemCount: number) {
  trackEvent("proceed_to_checkout", { currency: "USD", value: valueCents / 100, items_count: itemCount })
}

export function trackBeginCheckout(valueCents: number, items: TrackItem[]) {
  trackEvent("begin_checkout", {
    currency: "USD",
    value: valueCents / 100,
    items_count: items.length,
    items: items.map(gaItem),
  }, { vercel: { items_count: items.length, value: valueCents / 100 } })
}

export function trackPurchase(order: {
  transactionId: string
  currency: string
  value: number
  items: { item_id: string; item_name: string; item_category?: string; price: number; quantity: number }[]
}) {
  trackEvent("purchase", {
    transaction_id: order.transactionId,
    currency: order.currency,
    value: order.value,
    items: order.items,
  }, { vercel: { value: order.value, items_count: order.items.length } })
}

// ── Promotions (popups, nudges, tours, banners) ─────────────────────────
// promotion_id should be stable per mechanic+variant (e.g. the drop id),
// so two mechanics can be compared in GA4 Reports > Promotions.

export interface Promo {
  id: string
  name: string
  creative?: string
}

function promoParams(p: Promo) {
  return {
    promotion_id: p.id,
    promotion_name: p.name,
    creative_name: p.creative,
  }
}

export function trackPromoView(p: Promo) {
  trackEvent("view_promotion", promoParams(p))
}

export function trackPromoClick(p: Promo, label?: string) {
  trackEvent("select_promotion", { ...promoParams(p), label })
}

export function trackPromoDismiss(p: Promo, label?: string) {
  trackEvent("promo_dismiss", { ...promoParams(p), label })
}

// ── Generic interaction events (used by AnalyticsTracker) ───────────────

export function trackClick(params: {
  area: string
  label: string
  detail?: string
  link_url?: string
  outbound?: boolean
  item_id?: string
  item_name?: string
}) {
  trackEvent("ui_click", params, {
    vercel: { area: params.area, label: params.detail ? `${params.label}:${params.detail}` : params.label },
  })
}

export function trackSearch(area: string, term: string, results?: number) {
  trackEvent("search", { area, search_term: term, results })
}

export function trackControlChange(area: string, label: string, detail: string) {
  trackEvent("ui_change", { area, label, detail }, { vercel: { area, label: `${label}:${detail}` } })
}

export function trackScrollDepth(percent: number) {
  trackEvent("scroll_depth", { percent_scrolled: percent }, { vercel: false })
}

export function trackExperimentImpression(experimentId: string, variantId: string) {
  trackEvent("experiment_impression", { experiment_id: experimentId, variant_id: variantId })
}

// ── Auth ────────────────────────────────────────────────────────────────

export function trackSignUp(method: string = "email") {
  trackEvent("sign_up", { method })
}

export function trackLogin(method: string = "email") {
  trackEvent("login", { method })
}
