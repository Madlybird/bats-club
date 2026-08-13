"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

// Only shown to EEA/UK visitors (app/api/geo/route.ts) — GDPR/UK-GDPR/PECR
// require opt-in consent before analytics/ad cookies for that region only.
// Consent Mode v2 defaults (app/layout.tsx) already deny those cookies for
// the same region until this banner's Accept button fires 'consent update'.
const CHOICE_KEY = "bats_cookie_consent" // "granted" | "denied"

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

const dict = {
  en: {
    body: "We use cookies for analytics and, if you agree, ad personalisation. You can change your mind any time — see our Privacy Policy.",
    accept: "Accept",
    reject: "Reject",
    privacy: "Privacy Policy",
    privacyHref: "/privacy",
  },
  ru: {
    body: "Мы используем куки для аналитики и, с вашего согласия, персонализации рекламы. Вы можете изменить решение в любой момент — см. Политику конфиденциальности.",
    accept: "Принять",
    reject: "Отклонить",
    privacy: "Политика конфиденциальности",
    privacyHref: "/ru/privacy",
  },
  jp: {
    body: "当サイトでは分析のためにクッキーを使用しており、同意いただいた場合は広告のパーソナライズにも使用します。同意はいつでも変更できます — プライバシーポリシーをご覧ください。",
    accept: "同意する",
    reject: "拒否する",
    privacy: "プライバシーポリシー",
    privacyHref: "/jp/privacy",
  },
}

function setConsent(granted: boolean) {
  const value = granted ? "granted" : "denied"
  window.gtag?.("consent", "update", {
    ad_storage: value,
    ad_user_data: value,
    ad_personalization: value,
    analytics_storage: value,
  })
  try {
    localStorage.setItem(CHOICE_KEY, value)
  } catch {
    /* ignore */
  }
}

export default function CookieConsentBanner() {
  const pathname = usePathname() || "/"
  const [visible, setVisible] = useState(false)

  const locale = pathname.startsWith("/ru") ? "ru" : pathname.startsWith("/jp") ? "jp" : "en"
  const t = dict[locale]

  useEffect(() => {
    let alreadyChosen = false
    try {
      alreadyChosen = localStorage.getItem(CHOICE_KEY) !== null
    } catch {
      alreadyChosen = false
    }
    if (alreadyChosen) return

    let cancelled = false
    fetch("/api/geo")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.consentRequired) setVisible(true)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [])

  if (!visible) return null

  const handle = (granted: boolean) => {
    setConsent(granted)
    setVisible(false)
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[100] p-4"
      role="dialog"
      aria-modal="false"
      aria-label="Cookie consent"
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-[#ff2d78]/30 bg-[#0b0b14] p-5 shadow-[0_0_60px_rgba(255,45,120,0.2)] flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-white/60 leading-relaxed flex-1">
          {t.body}{" "}
          <a href={t.privacyHref} className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            {t.privacy}
          </a>
        </p>
        <div className="flex gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handle(false)}
            className="px-5 py-2.5 border border-white/10 hover:border-white/25 text-white/50 hover:text-white text-sm font-bold lowercase tracking-wide rounded-full transition-all"
          >
            {t.reject}
          </button>
          <button
            type="button"
            onClick={() => handle(true)}
            className="px-5 py-2.5 text-sm font-bold lowercase tracking-wide text-white rounded-full transition-all"
            style={{ background: "#ff2d78", boxShadow: "0 0 30px rgba(255,45,120,0.3)" }}
          >
            {t.accept}
          </button>
        </div>
      </div>
    </div>
  )
}
