"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { en, ru, jp } from "@/lib/dict"

const SHOWN_KEY = "batsclub_regprompt_shown"
const DELAY_MS = 120_000 // 2 minutes on any page

export default function RegisterPrompt() {
  const pathname = usePathname() || "/"
  const { status } = useSession()
  const hasSession = status === "authenticated"
  const [open, setOpen] = useState(false)

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
    if (hasSession || onAuthPage) return
    let shown = false
    try {
      shown = window.sessionStorage.getItem(SHOWN_KEY) === "1"
    } catch {
      shown = false
    }
    if (shown) return

    const t = setTimeout(() => {
      try {
        window.sessionStorage.setItem(SHOWN_KEY, "1")
      } catch {
        /* ignore */
      }
      setOpen(true)
    }, DELAY_MS)
    return () => clearTimeout(t)
  }, [hasSession, onAuthPage, pathname])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={dict.register_modal_title}
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
          {dict.register_modal_title}
        </h2>
        <p className="mt-3 text-sm text-white/55 leading-relaxed">
          {dict.register_modal_body}
        </p>
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
      </div>
    </div>
  )
}
