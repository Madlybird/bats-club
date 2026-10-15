"use client"

// Minimal client-side A/B split for testing site mechanics (popup copy,
// delays, CTA wording, tour on/off...).
//
//   const variant = useVariant("drop_cta_2026_11", ["a", "b"])
//   if (variant === null) return null   // not decided yet (first render)
//
// The variant is sticky per browser (localStorage) and logged once per
// browser session as GA4 `experiment_impression` {experiment_id,
// variant_id}. Compare variants in GA4 Explore with a segment on that
// event's variant_id, or pass the variant into the mechanic's promo id
// (e.g. `${dropId}:${variant}`) so Reports > Promotions splits it for free.

import { useEffect, useState } from "react"
import { trackExperimentImpression } from "@/lib/analytics"

const KEY = (id: string) => `bats_exp_${id}`

export function getVariant<T extends string>(
  experimentId: string,
  variants: readonly T[],
  weights?: readonly number[],
): T {
  try {
    const stored = window.localStorage.getItem(KEY(experimentId))
    if (stored && (variants as readonly string[]).includes(stored)) return stored as T
  } catch {
    /* storage blocked — falls through to a per-page-load pick */
  }
  const w = weights ?? variants.map(() => 1)
  const total = w.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  let pick = variants[variants.length - 1]
  for (let i = 0; i < variants.length; i++) {
    r -= w[i]
    if (r < 0) {
      pick = variants[i]
      break
    }
  }
  try {
    window.localStorage.setItem(KEY(experimentId), pick)
  } catch {
    /* ignore */
  }
  return pick
}

/** null until mounted, so server and first client render agree. */
export function useVariant<T extends string>(
  experimentId: string,
  variants: readonly T[],
  weights?: readonly number[],
): T | null {
  const [variant, setVariant] = useState<T | null>(null)

  useEffect(() => {
    const v = getVariant(experimentId, variants, weights)
    setVariant(v)
    const seenKey = `bats_exp_seen_${experimentId}`
    try {
      if (window.sessionStorage.getItem(seenKey) === "1") return
      window.sessionStorage.setItem(seenKey, "1")
    } catch {
      /* ignore */
    }
    trackExperimentImpression(experimentId, v)
    // variants/weights are expected to be constant literals
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experimentId])

  return variant
}
