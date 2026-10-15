"use client"

// Site-wide interaction tracking, driven by data-* attributes so page
// components only need markup, not handlers. Mounted once in app/layout.
//
//   data-area="art_grid"          names a zone; every click inside it is
//                                 reported with that area. Unnamed zones
//                                 fall back to header / footer / dialog / page.
//   data-track="lightbox_open"    explicit label for a clickable (else the
//                                 aria-label or visible text is used).
//   data-track-value="Poster"     extra detail sent with the label.
//   data-item-id / -name / -cat / -price / -variant
//                                 marks a product card: its impressions go
//                                 out as view_item_list (position = order
//                                 within its area) and a link click inside
//                                 it as select_item.
//   data-promo-id / -name / -creative
//                                 marks a popup / banner: view_promotion when
//                                 visible, select_promotion on a click
//                                 inside, promo_dismiss when the clicked
//                                 element has data-promo-action="dismiss".
//   data-track="search"           on a text input: debounced `search` event.
//   data-track="<name>"           on a <select>: `ui_change` with the value.
//
// Also: scroll depth 25/50/75/100 per page view.

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import {
  trackClick,
  trackControlChange,
  trackPromoClick,
  trackPromoDismiss,
  trackPromoView,
  trackScrollDepth,
  trackSearch,
  trackSelectItem,
  trackViewItemList,
  type Promo,
  type TrackItem,
} from "@/lib/analytics"

const CLICKABLE = "a,button,[role=button],[data-track]"
const ITEM = "[data-item-id]"
const PROMO = "[data-promo-id]"

function areaOf(el: Element): string {
  const named = el.closest<HTMLElement>("[data-area]")
  if (named?.dataset.area) return named.dataset.area
  if (el.closest("header")) return "header"
  if (el.closest("footer")) return "footer"
  if (el.closest("[role=dialog]")) return "dialog"
  return "page"
}

function areaRoot(el: Element): ParentNode {
  return el.closest("[data-area]") ?? document
}

function labelOf(el: HTMLElement): string {
  const raw =
    el.dataset.track ||
    el.getAttribute("aria-label") ||
    el.innerText ||
    el.querySelector("img")?.getAttribute("alt") ||
    el.tagName.toLowerCase()
  return raw.replace(/\s+/g, " ").trim().slice(0, 60)
}

function itemOf(card: HTMLElement): TrackItem {
  const d = card.dataset
  const root = areaRoot(card)
  const index = Array.from(root.querySelectorAll(ITEM)).indexOf(card)
  return {
    id: d.itemId!,
    name: d.itemName || d.itemId!,
    category: d.itemCat,
    variant: d.itemVariant,
    price: d.itemPrice ? Number(d.itemPrice) : undefined,
    index: index >= 0 ? index + 1 : undefined,
    listName: areaOf(card),
  }
}

function promoOf(el: HTMLElement): Promo {
  return {
    id: el.dataset.promoId!,
    name: el.dataset.promoName || el.dataset.promoId!,
    creative: el.dataset.promoCreative,
  }
}

export default function AnalyticsTracker() {
  const pathname = usePathname()

  // Clicks — capture phase so components that stopPropagation still count.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null
      const el = target?.closest<HTMLElement>(CLICKABLE)
      if (!el) return
      const area = areaOf(el)
      const label = labelOf(el)
      const detail = el.dataset.trackValue

      let link_url: string | undefined
      let outbound: boolean | undefined
      if (el instanceof HTMLAnchorElement && el.href) {
        try {
          const u = new URL(el.href)
          outbound = u.origin !== window.location.origin
          link_url = outbound ? u.href : u.pathname + u.search
        } catch {
          /* ignore malformed href */
        }
      }

      const card = el.closest<HTMLElement>(ITEM)
      const item = card ? itemOf(card) : undefined

      trackClick({ area, label, detail, link_url, outbound, item_id: item?.id, item_name: item?.name })

      if (item && el instanceof HTMLAnchorElement) trackSelectItem(item.listName!, item)

      const promoEl = el.closest<HTMLElement>(PROMO)
      if (promoEl) {
        const promo = promoOf(promoEl)
        if (el.dataset.promoAction === "dismiss") trackPromoDismiss(promo, label)
        else trackPromoClick(promo, label)
      }
    }
    document.addEventListener("click", onClick, true)
    return () => document.removeEventListener("click", onClick, true)
  }, [])

  // Search inputs + selects.
  useEffect(() => {
    const timers = new WeakMap<HTMLInputElement, ReturnType<typeof setTimeout>>()
    const onInput = (e: Event) => {
      const el = e.target
      if (!(el instanceof HTMLInputElement) || el.dataset.track !== "search") return
      clearTimeout(timers.get(el))
      timers.set(
        el,
        setTimeout(() => {
          const term = el.value.trim().toLowerCase()
          if (term.length < 2) return
          trackSearch(areaOf(el), term.slice(0, 100))
        }, 1200),
      )
    }
    const onChange = (e: Event) => {
      const el = e.target
      if (!(el instanceof HTMLSelectElement) || !el.dataset.track) return
      trackControlChange(areaOf(el), el.dataset.track, el.value)
    }
    document.addEventListener("input", onInput, true)
    document.addEventListener("change", onChange, true)
    return () => {
      document.removeEventListener("input", onInput, true)
      document.removeEventListener("change", onChange, true)
    }
  }, [])

  // Impressions (product cards + promos) and scroll depth, reset per page.
  useEffect(() => {
    const seen = new Set<Element>()
    const buffer = new Map<string, TrackItem[]>()
    let flushTimer: ReturnType<typeof setTimeout> | undefined

    const flush = () => {
      flushTimer = undefined
      buffer.forEach((items, list) => trackViewItemList(list, items))
      buffer.clear()
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || seen.has(entry.target)) continue
          seen.add(entry.target)
          io.unobserve(entry.target)
          const el = entry.target as HTMLElement
          if (el.dataset.promoId) {
            trackPromoView(promoOf(el))
            continue
          }
          const item = itemOf(el)
          const list = item.listName!
          buffer.set(list, [...(buffer.get(list) ?? []), item])
        }
        if (buffer.size && !flushTimer) flushTimer = setTimeout(flush, 1500)
      },
      { threshold: 0.5 },
    )

    const scan = () => {
      document.querySelectorAll(`${ITEM},${PROMO}`).forEach((el) => {
        if (!seen.has(el)) io.observe(el)
      })
    }
    scan()
    let scanTimer: ReturnType<typeof setTimeout> | undefined
    const mo = new MutationObserver(() => {
      if (scanTimer) return
      scanTimer = setTimeout(() => {
        scanTimer = undefined
        scan()
      }, 300)
    })
    mo.observe(document.body, { childList: true, subtree: true })

    const marks = [25, 50, 75, 100]
    const hit = new Set<number>()
    const onScroll = () => {
      const doc = document.documentElement
      const scrollable = doc.scrollHeight - window.innerHeight
      if (scrollable < 200) return
      const pct = (window.scrollY / scrollable) * 100
      for (const m of marks) {
        if (pct >= m - 2 && !hit.has(m)) {
          hit.add(m)
          trackScrollDepth(m)
        }
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true })

    const onHide = () => {
      if (document.visibilityState === "hidden" && buffer.size) flush()
    }
    document.addEventListener("visibilitychange", onHide)

    return () => {
      if (flushTimer) clearTimeout(flushTimer)
      if (buffer.size) flush()
      if (scanTimer) clearTimeout(scanTimer)
      io.disconnect()
      mo.disconnect()
      window.removeEventListener("scroll", onScroll)
      document.removeEventListener("visibilitychange", onHide)
    }
  }, [pathname])

  return null
}
