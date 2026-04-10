"use client"

import { useEffect, useState } from "react"

interface ToastItem {
  id: number
  message: string
}

/**
 * Minimal global toaster. Any client component can show a toast by
 * dispatching a `bats:toast` window event with `detail: string`.
 *
 *   window.dispatchEvent(new CustomEvent("bats:toast", { detail: "Hi" }))
 *
 * Mounted once in the root layout — no provider wiring needed.
 */
export default function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail
      if (typeof detail !== "string" || !detail) return
      const id = Date.now() + Math.random()
      setToasts((prev) => [...prev, { id, message: detail }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 3000)
    }
    window.addEventListener("bats:toast", handler)
    return () => window.removeEventListener("bats:toast", handler)
  }, [])

  if (toasts.length === 0) return null

  return (
    <div
      className="fixed z-[9999] flex flex-col items-center gap-2 pointer-events-none"
      style={{
        left: "50%",
        bottom: "24px",
        transform: "translateX(-50%)",
        maxWidth: "calc(100vw - 32px)",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto rounded-full px-5 py-3 text-sm font-medium text-white shadow-lg backdrop-blur-md border border-white/10 animate-[fadeIn_.15s_ease-out]"
          style={{
            background: "linear-gradient(135deg, rgba(255,45,120,0.95), rgba(124,58,237,0.95))",
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
