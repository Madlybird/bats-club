"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface Props {
  title: string
  body: string
  ctaLabel?: string
  ctaHref?: string
  storageKey: string
  delayMs?: number
}

// Dismissible bat companion toast (bottom-right). Shows once per
// browser session, after `delayMs` on entry.
export default function BatNudge({
  title,
  body,
  ctaLabel,
  ctaHref,
  storageKey,
  delayMs = 8000,
}: Props) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    let seen = false
    try {
      seen = window.sessionStorage.getItem(storageKey) === "1"
    } catch {
      seen = false
    }
    if (seen) return
    const t = setTimeout(() => {
      try {
        window.sessionStorage.setItem(storageKey, "1")
      } catch {
        /* ignore */
      }
      setOpen(true)
    }, delayMs)
    return () => clearTimeout(t)
  }, [storageKey, delayMs])

  if (!open) return null

  return (
    <div className="fixed z-[80] bottom-4 inset-x-4 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:max-w-sm">
      <div className="relative flex items-start gap-3 rounded-2xl border border-[#ff2d78]/30 bg-[#0b0b14]/95 backdrop-blur px-5 py-4 shadow-[0_0_40px_rgba(255,45,120,0.25)]">
        <button
          type="button"
          aria-label="close"
          onClick={() => setOpen(false)}
          className="absolute top-2.5 right-3 text-white/30 hover:text-white text-lg leading-none"
        >
          ×
        </button>
        <img
          src="/bat.png"
          alt=""
          aria-hidden="true"
          className="w-11 h-11 flex-shrink-0 animate-float-slow"
        />
        <div className="min-w-0 flex-1 pr-3">
          <p className="text-sm font-black lowercase tracking-tight text-white">
            {title}
          </p>
          <p className="mt-1 text-xs text-white/55 leading-relaxed">{body}</p>
          {ctaLabel && ctaHref && (
            <Link
              href={ctaHref}
              onClick={() => setOpen(false)}
              className="inline-block mt-3 px-4 py-2 text-xs font-bold lowercase tracking-wide text-white rounded-full transition-all"
              style={{
                background: "#ff2d78",
                boxShadow: "0 0 20px rgba(255,45,120,0.35)",
              }}
            >
              {ctaLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
