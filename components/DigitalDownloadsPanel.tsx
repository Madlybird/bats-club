"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

// On /order/success: if the just-completed order includes digital art, show the
// download link(s). Same data source as TrackPurchaseOnMount — /api/orders/
// by-session, gated by the Stripe session id in the URL.
export default function DigitalDownloadsPanel() {
  const params = useSearchParams()
  const sessionId = params.get("session_id")
  const [links, setLinks] = useState<string[]>([])

  useEffect(() => {
    if (!sessionId) return
    let cancelled = false
    fetch(`/api/orders/by-session?session_id=${encodeURIComponent(sessionId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && Array.isArray(d?.downloadLinks)) setLinks(d.downloadLinks)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [sessionId])

  if (links.length === 0) return null

  return (
    <div
      className="mb-8 rounded-2xl border p-5 text-left"
      style={{ background: "rgba(255,45,120,0.08)", borderColor: "rgba(255,45,120,0.25)" }}
    >
      <p className="text-white font-bold text-sm mb-3">
        Your download{links.length > 1 ? "s" : ""}
      </p>
      <div className="flex flex-col gap-2">
        {links.map((url, i) => (
          <a
            key={url}
            href={url}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg font-bold text-white text-sm transition-opacity hover:opacity-90"
            style={{ background: "#ff2d78" }}
          >
            Download PDF{links.length > 1 ? ` ${i + 1}` : ""}
          </a>
        ))}
      </div>
      <p className="text-[11px] text-white/35 mt-3">
        Also sent to your email. Available for 7 days. Personal use only — no resale or
        redistribution of the file.
      </p>
    </div>
  )
}
