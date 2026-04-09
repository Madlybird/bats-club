"use client"

import { useRouter } from "next/navigation"

interface Props {
  series: { name: string; count: number }[]
  activeSeries: string | null
  heading: string
}

export default function SeriesBanner({ series, activeSeries, heading }: Props) {
  const router = useRouter()

  function select(name: string) {
    const params = new URLSearchParams(window.location.search)
    if (params.get("series") === name) {
      params.delete("series")
    } else {
      params.set("series", name)
    }
    const q = params.toString()
    router.push(q ? `?${q}` : window.location.pathname, { scroll: false })
  }

  return (
    <div className="mb-8">
      <p className="text-[11px] font-semibold tracking-[0.18em] text-white/25 uppercase mb-4">
        {heading}
      </p>
      <div
        className="flex gap-3 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {series.map((s) => {
          const active = activeSeries === s.name
          return (
            <button
              key={s.name}
              onClick={() => select(s.name)}
              className="flex-shrink-0 flex flex-col items-start px-5 py-3.5 rounded-2xl border transition-all duration-200 text-left"
              style={
                active
                  ? {
                      background: "rgba(255,45,120,0.12)",
                      borderColor: "rgba(255,45,120,0.4)",
                    }
                  : {
                      background: "rgba(255,255,255,0.03)",
                      borderColor: "rgba(255,255,255,0.06)",
                    }
              }
            >
              <span
                className="text-sm font-bold leading-tight lowercase tracking-tight"
                style={{ color: active ? "#ff2d78" : "rgba(255,255,255,0.75)" }}
              >
                {s.name}
              </span>
              <span
                className="text-xs mt-1 font-medium"
                style={{ color: active ? "rgba(255,45,120,0.7)" : "rgba(255,255,255,0.2)" }}
              >
                {s.count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
