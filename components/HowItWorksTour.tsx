"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"

interface Step {
  num: string
  title: string
  body: string
  cta: string
  href: string
}

interface Props {
  heading: string
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

export default function HowItWorksTour({
  heading,
  steps,
  gotItLabel,
  skipLabel,
}: Props) {
  // phase: idle (no tour) | active (bubble on a step) | flying (bat burst)
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
    }, 600)
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

  const touring = phase !== "idle"

  return (
    <section className="relative py-20 border-t border-white/[0.05]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <span className="inline-block w-8 h-0.5 bg-[#ff2d78] mb-4" />
            <h2
              className="font-black lowercase leading-tight tracking-tighter text-white"
              style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)" }}
            >
              {heading}
            </h2>
          </div>
          {touring && (
            <button
              type="button"
              onClick={finish}
              className="text-xs font-bold text-white/30 hover:text-[#ff2d78] transition-colors lowercase tracking-wide whitespace-nowrap"
            >
              {skipLabel}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((step, i) => {
            const isActive = touring && i === active
            const isDone = touring && i < active
            return (
              <div
                key={step.num}
                className={`group relative p-6 rounded-2xl border bg-white/[0.015] flex flex-col transition-all duration-500 ${
                  isActive
                    ? "border-[#ff2d78]/60 shadow-[0_0_40px_rgba(255,45,120,0.25)] scale-[1.02]"
                    : isDone
                    ? "border-[#ff2d78]/20 opacity-60"
                    : "border-white/[0.05] hover:border-[#ff2d78]/20"
                }`}
              >
                {isActive && (
                  <img
                    src="/bat.png"
                    alt=""
                    aria-hidden="true"
                    className="absolute -top-5 -left-3 w-12 h-12 animate-float-slow drop-shadow-[0_0_12px_rgba(255,45,120,0.6)]"
                  />
                )}
                <p
                  className="text-5xl font-black leading-none select-none mb-5"
                  style={{ color: "rgba(255,45,120,0.6)" }}
                >
                  {step.num}
                </p>
                <h3 className="text-base font-bold text-white lowercase tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-white/35 leading-relaxed flex-1">
                  {step.body}
                </p>
                <Link
                  href={step.href}
                  className="mt-4 text-xs text-[#ff2d78] font-bold lowercase tracking-wide hover:text-white transition-colors"
                >
                  {step.cta} →
                </Link>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bat burst between steps */}
      {phase === "flying" && (
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
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
                bottom: "10%",
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
    </section>
  )
}
