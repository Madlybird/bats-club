"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import Image from "@/components/SiteImage"
import { en, ru, jp } from "@/lib/dict"
import { ART_DROP, DROP_TEXT, isDropActive } from "@/lib/drop"

const DELAY_MS = 15_000 // 15 seconds after entry
const SHOWN_KEY = "batsclub_regprompt_shown" // once per browser (localStorage), not per tab
// While an art drop (lib/drop.ts) is running this modal announces it instead
// of asking for sign-up: shown sooner, to everyone incl. logged-in users,
// once per browser under its own key, and not on /art pages (the visitor is
// already looking at the drop). Reverts to the sign-up prompt at endsAt.
const DROP_DELAY_MS = 4_000
const DROP_SHOWN_KEY = `batsclub_drop_shown_${ART_DROP.id}`

export default function RegisterPrompt() {
  const pathname = usePathname() || "/"
  const { status } = useSession()
  const hasSession = status === "authenticated"
  const [open, setOpen] = useState(false)
  const [drop, setDrop] = useState(false)

  const locale = pathname.startsWith("/ru")
    ? "ru"
    : pathname.startsWith("/jp")
    ? "jp"
    : "en"
  const dict = locale === "ru" ? ru : locale === "jp" ? jp : en
  const base = locale === "en" ? "" : `/${locale}`

  // Don't run on auth pages or for logged-in users.
  const onAuthPage = /\/(login|register)\/?$/.test(pathname)
  const onArtPage = /^(\/(ru|jp))?\/art(\/|$)/.test(pathname)

  useEffect(() => {
    if (onAuthPage) return
    // Local review: ?drop forces the drop modal regardless of storage.
    const forceDrop =
      process.env.NODE_ENV !== "production" &&
      new URLSearchParams(window.location.search).has("drop")
    const dropNow = forceDrop || (isDropActive() && !onArtPage)
    if (!dropNow && hasSession) return
    const key = dropNow ? DROP_SHOWN_KEY : SHOWN_KEY
    let shown = false
    try {
      shown = window.localStorage.getItem(key) === "1"
    } catch {
      shown = false
    }
    if (shown && !forceDrop) return
    const t = setTimeout(() => {
      try {
        window.localStorage.setItem(key, "1")
      } catch {
        /* ignore */
      }
      setDrop(dropNow)
      setOpen(true)
    }, forceDrop ? 500 : dropNow ? DROP_DELAY_MS : DELAY_MS)
    return () => clearTimeout(t)
  }, [hasSession, onAuthPage, onArtPage, pathname])

  if (!open) return null
  const dt = DROP_TEXT[locale]

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={drop ? dt.title : dict.register_modal_title}
      data-area={drop ? "drop_modal" : "register_modal"}
      data-promo-id={drop ? ART_DROP.id : "register_prompt"}
      data-promo-name={drop ? "art_drop_modal" : "register_modal"}
      data-promo-creative={locale}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        data-track="backdrop"
        data-promo-action="dismiss"
        onClick={() => setOpen(false)}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-[#ff2d78]/30 bg-[#0b0b14] p-7 shadow-[0_0_60px_rgba(255,45,120,0.25)]">
        <button
          type="button"
          aria-label="close"
          data-promo-action="dismiss"
          onClick={() => setOpen(false)}
          className="absolute top-2 right-2 w-10 h-10 flex items-center justify-center text-white/30 hover:text-white text-xl leading-none"
        >
          ×
        </button>
        {drop ? (
          <>
            <div className="grid grid-cols-3 gap-2 mb-4 mt-3">
              {ART_DROP.covers.map((src) => (
                <div
                  key={src}
                  className="relative rounded-lg overflow-hidden border border-white/10"
                  style={{ aspectRatio: "1 / 1", background: "#0a0a0a" }}
                >
                  <Image src={src} alt="" fill className="object-cover" sizes="140px" />
                </div>
              ))}
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#ff2d78]">
              {dt.eyebrow}
            </p>
            <h2 className="mt-0.5 text-xl font-black leading-tight tracking-tight text-white">
              {dt.title}
            </h2>
            <p className="mt-1 text-sm text-white/55 leading-snug">{dt.body}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={`${base}/art`}
                data-track="drop_cta"
                onClick={() => setOpen(false)}
                className="px-6 py-3 text-sm font-bold lowercase tracking-wide text-white rounded-full transition-all"
                style={{
                  background: "#ff2d78",
                  boxShadow: "0 0 30px rgba(255,45,120,0.3)",
                }}
              >
                {dt.cta}
              </Link>
            </div>
          </>
        ) : (
          <>
            <img
              src="/bat.png"
              alt=""
              aria-hidden="true"
              className="w-14 h-14 mb-4 animate-float-slow"
            />
            <h2 className="text-xl font-black lowercase tracking-tight text-white">
              {dict.register_modal_title}
            </h2>
            <p className="mt-3 text-sm text-white/55 leading-relaxed">
              {dict.register_modal_body}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`${base}/register`}
                data-track="register_cta"
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
                data-track="maybe_later"
                data-promo-action="dismiss"
                onClick={() => setOpen(false)}
                className="px-6 py-3 border border-white/10 hover:border-white/25 text-white/50 hover:text-white text-sm font-bold lowercase tracking-wide rounded-full transition-all"
              >
                {dict.register_modal_dismiss}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
