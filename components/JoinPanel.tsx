"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { MEMBER_OFFER_ID } from "@/lib/member-offer"

// Non-blocking member-offer panel (bottom-right, bottom strip on mobile).
// Replaces the centered RegisterPrompt modal and the /archive bat nudge.
// Guests only, shown after a sign of interest instead of on entry: 25s on
// site, a 2nd page view, or 3 "Next photo" taps. Never on auth/cart/order
// pages, never on top of the cookie banner (EEA/UK only). Dismiss or CTA =
// silent for 30 days. The CTA opens /register?src=join_panel (sign_up
// attribution) with the typed email pre-filled; the offer itself
// (lib/member-offer.ts) is applied by /api/checkout on the first paid order.

const DWELL_MS = 25_000
const PHOTO_TAPS = 3
const SNOOZE_DAYS = 30
const SNOOZE_KEY = "batsclub_join_snoozed_at"
const PAGES_KEY = "batsclub_join_pages"
const SOURCE = "join_panel"
const PREFILL_KEY = "batsclub_signup_email" // read once by RegisterForm

const TEXT = {
  en: {
    eyebrow: "members",
    title: "50% off shipping on your first order",
    body: "Join Bats Club and the discount is applied automatically at checkout.",
    placeholder: "your email",
    cta: "get 50% off",
  },
  ru: {
    eyebrow: "участникам",
    title: "−50% на доставку первого заказа",
    body: "Вступай в Bats Club, и скидка применится в корзине сама.",
    placeholder: "твой email",
    cta: "получить",
  },
  jp: {
    eyebrow: "members",
    title: "初回注文の送料50%オフ",
    body: "Bats Clubに参加すると、カートで自動的に割引が適用されます。",
    placeholder: "メールアドレス",
    cta: "受け取る",
  },
}

function readStore(k: string, s: "local" | "session"): string | null {
  try {
    return (s === "local" ? localStorage : sessionStorage).getItem(k)
  } catch {
    return null
  }
}

function snooze() {
  try {
    localStorage.setItem(SNOOZE_KEY, String(Date.now()))
  } catch {
    /* ignore */
  }
}

export default function JoinPanel() {
  const pathname = usePathname() || "/"
  const router = useRouter()
  const { status } = useSession()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const taps = useRef(0)

  const locale = pathname.startsWith("/ru") ? "ru" : pathname.startsWith("/jp") ? "jp" : "en"
  const base = locale === "en" ? "" : `/${locale}`
  const t = TEXT[locale]
  const blockedPage = /\/(login|register|cart|verify|forgot-password|reset-password|order)(\/|$)/.test(pathname)

  useEffect(() => {
    if (status === "loading" || status === "authenticated" || blockedPage) return
    // Local review: ?join shows the panel right away, ignoring storage.
    const force =
      process.env.NODE_ENV !== "production" &&
      new URLSearchParams(window.location.search).has("join")

    if (!force) {
      const snoozedAt = Number(readStore(SNOOZE_KEY, "local") || 0)
      if (snoozedAt && Date.now() - snoozedAt < SNOOZE_DAYS * 864e5) return
    }

    let fired = false
    const show = () => {
      if (fired) return
      // Never stack on the cookie banner. It is only rendered for EEA/UK
      // visitors, so wait on the banner itself, not on a stored choice
      // (everyone else never makes one). The 25s interval retries.
      if (!force && document.querySelector("[data-cookie-banner]")) return
      fired = true
      setOpen(true)
    }

    if (force) {
      const ft = setTimeout(show, 300)
      return () => clearTimeout(ft)
    }

    // 2nd page view in this session.
    const pages = Number(readStore(PAGES_KEY, "session") || 0) + 1
    try {
      sessionStorage.setItem(PAGES_KEY, String(pages))
    } catch {
      /* ignore */
    }
    if (pages >= 2) show()

    // 25s on site (re-checked every 5s in case the cookie banner was open).
    const start = Date.now()
    const iv = setInterval(() => {
      if (Date.now() - start >= DWELL_MS) show()
    }, 5_000)

    // 3 "Next photo" taps.
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest('[aria-label="Next photo"]')
      if (!el) return
      taps.current += 1
      if (taps.current >= PHOTO_TAPS) show()
    }
    document.addEventListener("click", onClick)

    return () => {
      clearInterval(iv)
      document.removeEventListener("click", onClick)
    }
  }, [status, blockedPage, pathname])

  if (!open || blockedPage || status === "authenticated") return null

  const dismiss = () => {
    snooze()
    setOpen(false)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    snooze()
    setOpen(false)
    // The email travels in sessionStorage, never the URL: GA4 records the
    // full page URL, and an address there would be PII in analytics.
    const typed = email.trim()
    try {
      if (/^\S+@\S+\.\S+$/.test(typed)) sessionStorage.setItem(PREFILL_KEY, typed.slice(0, 254))
    } catch {
      /* ignore */
    }
    router.push(`${base}/register?src=${SOURCE}`)
  }

  return (
    <div
      className="fixed z-[90] bottom-0 inset-x-0 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:max-w-sm"
      role="complementary"
      aria-label={t.title}
      data-area={SOURCE}
      data-promo-id={MEMBER_OFFER_ID}
      data-promo-name={SOURCE}
      data-promo-creative={locale}
    >
      <div className="relative border-t sm:border border-[#ff2d78]/30 bg-[#0b0b14]/95 backdrop-blur px-5 py-4 sm:rounded-2xl shadow-[0_0_40px_rgba(255,45,120,0.25)]">
        <button
          type="button"
          aria-label="close"
          data-promo-action="dismiss"
          onClick={dismiss}
          className="absolute top-1 right-1 w-10 h-10 flex items-center justify-center text-white/30 hover:text-white text-lg leading-none"
        >
          ×
        </button>
        <div className="flex items-start gap-3 pr-6">
          <img src="/bat.png" alt="" aria-hidden="true" className="w-10 h-10 flex-shrink-0 animate-float-slow" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff2d78]">{t.eyebrow}</p>
            <p className="text-sm font-black lowercase tracking-tight text-white">{t.title}</p>
            <p className="mt-1 text-xs text-white/55 leading-relaxed">{t.body}</p>
          </div>
        </div>
        <form onSubmit={submit} className="mt-3 flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.placeholder}
            aria-label={t.placeholder}
            className="min-w-0 flex-1 rounded-full bg-white/5 border border-white/10 focus:border-[#ff2d78]/60 outline-none px-4 py-2 text-sm text-white placeholder-white/30"
          />
          <button
            type="submit"
            data-track="join_cta"
            className="px-4 py-2 text-xs font-bold lowercase tracking-wide text-white rounded-full transition-all"
            style={{ background: "#ff2d78", boxShadow: "0 0 20px rgba(255,45,120,0.35)" }}
          >
            {t.cta}
          </button>
        </form>
      </div>
    </div>
  )
}
