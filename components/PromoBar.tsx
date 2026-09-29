"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { PROMO_TEXT, SHIPPING_PROMO, isPromoActive, localeFromPath } from "@/lib/promo"

const DISMISS_KEY = `batsclub_promobar_dismissed_${SHIPPING_PROMO.code}`

// Thin site-wide strip above the navbar while the promo in lib/promo.ts
// runs. `initialActive` comes from the (statically cached) root layout so
// the first paint matches the prerendered HTML — no layout shift, no
// hydration mismatch. After mount the visitor's own clock decides, so a
// page cached before the deadline still hides the bar once it has passed.
export default function PromoBar({ initialActive }: { initialActive: boolean }) {
  const [visible, setVisible] = useState(initialActive)
  const locale = localeFromPath(usePathname())

  useEffect(() => {
    let dismissed = false
    try {
      dismissed = window.localStorage.getItem(DISMISS_KEY) === "1"
    } catch {
      dismissed = false
    }
    setVisible(isPromoActive() && !dismissed)
  }, [])

  if (!visible) return null

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, "1")
    } catch {
      /* ignore */
    }
    setVisible(false)
  }

  return (
    <div className="relative z-[51] bg-[#ff2d78] text-white text-xs sm:text-sm font-bold">
      <div className="max-w-7xl mx-auto px-10 py-2 text-center">
        <Link href={`${locale === "en" ? "" : `/${locale}`}/shop`} className="hover:underline underline-offset-2">
          {PROMO_TEXT[locale].bar}
        </Link>
      </div>
      <button
        type="button"
        aria-label="close"
        onClick={dismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 hover:text-white text-lg leading-none"
      >
        ×
      </button>
    </div>
  )
}
