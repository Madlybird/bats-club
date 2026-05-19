"use client"

import { useEffect, useState, useCallback } from "react"

interface Step {
  num: string
  title: string
  body: string
  cta: string
  href: string
}

interface Props {
  steps: Step[]
  gotItLabel: string
  skipLabel: string
}

const SEEN_KEY = "batsclub_howto_seen_v1"

// Deterministic bat burst — spawned between steps for the fly animation.
const BURST = Array.from({ length: 9 }, (_, i) => ({
  left: 8 + ((i * 53) % 84),
  delay: (i % 5) * 0.06,
  anim: ["bat-wave-left", "bat-wave-right", "bat-wave-slight"][i % 3],
  size: 30 + ((i * 7) % 22),
}))

// Floating bat companion that explains the steps once per visitor.
// Renders only as a fixed overlay — there is no on-page section.
export default function HowItWorksTour({
  steps,
  gotItLabel,
  skipLabel,
}: Props) {
  // phase: idle (no tour) | active (bubble visible) | flying (bat burst)
  const [phase, setPhase] = useState<"idle" | "active" | "flying">("idle")
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (typeof window === "undefined") return
    let seen = false
    try {
      seen = window.localStorage.getItem(SEEN_KEY) === "1"
    } catch {
      seen = false
    }
    if (seen) return
    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    )?.matches
    if (reduce) return
    const t = setTimeout(() => {
      setActive(0)
      setPhase("active")
    }, 1200)
    return () => clearTimeout(t)
  }, [])

  const finish = useCallback(() => {
    try {
      window.localStorage.setItem(SEEN_KEY, "1")
    } catch {
      /* ignore */
    }
    setPhase("idle")
  }, [])

  const next = useCallback(() => {
    if (active >= steps.length - 1) {
      finish()
      return
    }
    setPhase("flying")
    setTimeout(() => {
      setActive((a) => a + 1)
      setPhase("active")
    }, 950)
  }, [active, steps.length, finish])

  if (phase === "idle") return null

  return (
    <>
      {/* Bat burst between steps */}
      {phase === "flying" && (
        <div
          className="pointer-events-none fixed inset-0 z-[55] overflow-hidden"
          aria-hidden="true"
        >
          {BURST.map((b, i) => (
            <img
              key={i}
              src="/bat.png"
              alt=""
              style={{
                position: "absolute",
                left: `${b.left}%`,
                bottom: "12%",
                width: b.size,
                height: b.size,
                opacity: 0,
                animation: `${b.anim} 1s ease-in-out ${b.delay}s 1 forwards`,
              }}
            />
          ))}
        </div>
      )}

      {/* Bat companion bubble */}
      {phase === "active" && (
        <div className="fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-5 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-4 max-w-md w-full rounded-2xl border border-[#ff2d78]/30 bg-[#0b0b14]/95 backdrop-blur px-5 py-4 shadow-[0_0_40px_rgba(255,45,120,0.25)]">
            <img
              src="/bat.png"
              alt=""
              aria-hidden="true"
              className="w-12 h-12 flex-shrink-0 animate-float-slow"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold tracking-[0.15em] text-[#ff2d78] uppercase">
                {steps[active]?.num} · {steps[active]?.title}
              </p>
              <p className="mt-1 text-sm text-white/70 leading-snug">
                {steps[active]?.body}
              </p>
              <button
                type="button"
                onClick={finish}
                className="mt-1.5 text-[11px] font-bold text-white/30 hover:text-[#ff2d78] transition-colors lowercase tracking-wide"
              >
                {skipLabel}
              </button>
            </div>
            <button
              type="button"
              onClick={next}
              className="flex-shrink-0 px-4 py-2 text-xs font-bold lowercase tracking-wide text-white rounded-full transition-all"
              style={{
                background: "#ff2d78",
                boxShadow: "0 0 20px rgba(255,45,120,0.4)",
              }}
            >
              {gotItLabel}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
