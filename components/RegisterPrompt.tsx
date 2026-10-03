"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { en, ru, jp } from "@/lib/dict"
import { PROMO_TEXT, SHIPPING_PROMO, isPromoActive } from "@/lib/promo"

const DELAY_MS = 15_000 // 15 seconds after entry
const SHOWN_KEY = "batsclub_regprompt_shown" // once per browser (localStorage), not per tab
// While a promo (lib/promo.ts) is running this modal announces it instead
// of asking for sign-up: shown sooner, to everyone incl. logged-in users,
// and tracked under its own key so it isn't suppressed by an earlier
// sign-up prompt. Reverts to the sign-up prompt on its own at endsAt.
const PROMO_DELAY_MS = 4_000
const PROMO_SHOWN_KEY = `batsclub_promo_shown_${SHIPPING_PROMO.code}`

export default function RegisterPrompt() {
  const pathname = usePathname() || "/"
  const { status } = useSession()
  const hasSession = status === "authenticated"
  const [open, setOpen] = useState(false)
  const [promo, setPromo] = useState(false)

  const locale = pathname.startsWith("/ru")
    ? "ru"
    : pathname.startsWith("/jp")
    ? "jp"
    : "en"
  const dict = locale === "ru" ? ru : locale === "jp" ? jp : en
  const base = locale === "en" ? "" : `/${locale}`

  // Don't run on auth pages or for logged-in users.
  const onAuthPage = /\/(login|register)\/?$/.test(pathname)

  useEffect(() => {
    if (onAuthPage) return
    const promoNow = isPromoActive()
    if (!promoNow && hasSession) return
    const key = promoNow ? PROMO_SHOWN_KEY : SHOWN_KEY
    let shown = false
    try {
      shown = window.localStorage.getItem(key) === "1"
    } catch {
      shown = false
    }
    if (shown) return
    const t = setTimeout(() => {
      try {
        window.localStorage.setItem(key, "1")
      } catch {
        /* ignore */
      }
      setPromo(promoNow)
      setOpen(true)
    }, promoNow ? PROMO_DELAY_MS : DELAY_MS)
    return () => clearTimeout(t)
  }, [hasSession, onAuthPage, pathname])

  if (!open) return null
  const pt = PROMO_TEXT[locale]

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={promo ? pt.modalTitle : dict.register_modal_title}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-[#ff2d78]/30 bg-[#0b0b14] p-7 shadow-[0_0_60px_rgba(255,45,120,0.25)]">
        <button
          type="button"
          aria-label="close"
          onClick={() => setOpen(false)}
          className="absolute top-3 right-4 text-white/30 hover:text-white text-xl leading-none"
        >
          ×
        </button>
        <img
          src="/bat.png"
          alt=""
          aria-hidden="true"
          className="w-14 h-14 mb-4 animate-float-slow"
        />
        <h2 className="text-xl font-black lowercase tracking-tight text-white">
          {promo ? pt.modalTitle : dict.register_modal_title}
        </h2>
        <p className="mt-3 text-sm text-white/55 leading-relaxed">
          {promo ? pt.modalBody : dict.register_modal_body}
        </p>
        {promo ? (
          <>
            <div className="mt-5 rounded-xl border border-dashed border-[#ff2d78]/50 bg-[#ff2d78]/10 py-3 text-center">
              <span className="text-2xl font-black tracking-[0.2em] text-[#ff2d78]">{SHIPPING_PROMO.code}</span>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href={`${base}/shop`}
                onClick={() => setOpen(false)}
                className="px-6 py-3 text-sm font-bold lowercase tracking-wide text-white rounded-full transition-all"
                style={{ background: "#ff2d78", boxShadow: "0 0 30px rgba(255,45,120,0.3)" }}
              >
                {pt.modalCta}
              </Link>
              {!hasSession && (
                <Link
                  href={`${base}/register`}
                  onClick={() => setOpen(false)}
                  className="text-xs text-white/40 hover:text-white underline underline-offset-2"
                >
                  {pt.modalRegister}
                </Link>
              )}
            </div>
          </>
        ) : (
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`${base}/register`}
            onClick={() => setOpen(false)}
            className="px-6 py-3 text-sm font-bold lowercase tracking-wide text-white rounded-full transition-all"
            style={{
              background: "#ff2d78",
              boxShadow: "0 0 30px rgba(255,45,120,0.3)",
            }}
          >
            {dict.register_modal_cta}
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-6 py-3 border border-white/10 hover:border-white/25 text-white/50 hover:text-white text-sm font-bold lowercase tracking-wide rounded-full transition-all"
          >
            {dict.register_modal_dismiss}
          </button>
        </div>
        )}
      </div>
    </div>
  )
}
