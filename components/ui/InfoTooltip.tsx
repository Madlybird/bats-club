"use client"

import { useState, useRef, useEffect } from "react"

export default function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-4 h-4 rounded-full border text-[10px] font-bold flex items-center justify-center transition-colors"
        style={{
          borderColor: "rgba(255,45,120,0.25)",
          color: "rgba(240,224,224,0.4)",
          background: "rgba(255,45,120,0.08)",
        }}
      >
        ?
      </button>
      {open && (
        <div
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-lg text-xs leading-relaxed shadow-xl"
          style={{
            background: "#1a0a10",
            border: "1px solid rgba(255,45,120,0.25)",
            color: "rgba(240,224,224,0.7)",
          }}
        >
          {text}
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 -mt-1"
            style={{ background: "#1a0a10", borderRight: "1px solid rgba(255,45,120,0.25)", borderBottom: "1px solid rgba(255,45,120,0.25)" }}
          />
        </div>
      )}
    </div>
  )
}
