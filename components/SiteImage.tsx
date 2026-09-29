"use client"

import { useState } from "react"
import Image, { type ImageProps } from "next/image"

// Only these sources go through Vercel's image optimizer — they must match
// images.remotePatterns / localPatterns in next.config.js, otherwise
// next/image throws at render time. Anything else (e.g. an OAuth avatar
// on a third-party host) is rendered as a plain <img>.
const SUPABASE_PUBLIC_PREFIX =
  "https://rnlnnunmzikpysstsywx.supabase.co/storage/v1/object/public/"

function isOptimizable(src: ImageProps["src"]): boolean {
  if (typeof src !== "string") return true // static import
  if (src.startsWith("/") && !src.startsWith("//")) return true
  return src.startsWith(SUPABASE_PUBLIC_PREFIX)
}

// next/image wrapper for figure/listing/art photos. Optimized (resized
// WebP, edge-cached) by default; if the optimizer ever fails for a given
// image — the April 2026 "blank photos on some phones" reports, most
// likely the old Hobby-plan optimization cap returning 402 — it falls
// back to the original file instead of showing a broken image.
export default function SiteImage(props: ImageProps) {
  const { src, onError, unoptimized, ...rest } = props
  // Keyed by src so a carousel that swaps photos re-tries the optimizer
  // for each new photo instead of staying on the fallback forever.
  const [failedSrc, setFailedSrc] = useState<ImageProps["src"] | null>(null)
  const bypass = unoptimized || failedSrc === src || !isOptimizable(src)

  return (
    <Image
      {...rest}
      src={src}
      unoptimized={bypass}
      onError={(e) => {
        if (!bypass) setFailedSrc(src)
        onError?.(e)
      }}
    />
  )
}
