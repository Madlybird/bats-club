"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { AgeGateReveal, type AgeGateLabels } from "@/components/AgeGate"

interface Props {
  photos: string[]
  alt: string
  isMature: boolean
  ageGateLabels: AgeGateLabels
  backHref: string
  zoomHint: string
}

// Left column of /art/[id]: 3:4 cover frame + thumbnail strip. Clicking the
// main image opens a full-size lightbox over the listing (object-contain so
// the whole print is visible), with arrow-key / swipe-dot navigation.
export default function ArtGallery({ photos, alt, isMature, ageGateLabels, backHref, zoomHint }: Props) {
  const [current, setCurrent] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  const safePhotos = photos.length > 0 ? photos : []
  const has = safePhotos.length > 0

  const go = useCallback(
    (dir: number) => {
      if (safePhotos.length < 2) return
      setCurrent((c) => (c + dir + safePhotos.length) % safePhotos.length)
    },
    [safePhotos.length],
  )

  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false)
      if (e.key === "ArrowLeft") go(-1)
      if (e.key === "ArrowRight") go(1)
    }
    window.addEventListener("keydown", onKey)
    // Lock body scroll while the lightbox is open.
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [lightbox, go])

  return (
    <div className="space-y-3">
      <AgeGateReveal
        isMature={isMature}
        labels={ageGateLabels}
        backHref={backHref}
        className="relative rounded-2xl overflow-hidden border border-white/[0.06]"
      >
        <button
          type="button"
          onClick={() => has && setLightbox(true)}
          className="group relative block w-full cursor-zoom-in"
          style={{ aspectRatio: "3 / 4", background: "#0a0a0a" }}
          aria-label={zoomHint}
        >
          {has ? (
            <Image
              src={safePhotos[current]}
              alt={alt}
              fill
              unoptimized
              priority
              className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl opacity-20">🦇</span>
            </div>
          )}
          <span className="pointer-events-none absolute inset-3 rounded-sm border border-white/10" />
          {has && (
            <span className="pointer-events-none absolute bottom-2 right-2 badge bg-black/60 text-white/80 border border-white/15 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
              {zoomHint}
            </span>
          )}
        </button>
      </AgeGateReveal>

      {/* Thumbnail strip — only when there's more than one photo */}
      {safePhotos.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {safePhotos.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              className={`relative w-16 rounded-lg overflow-hidden border transition-colors ${
                i === current ? "border-[#ff2d78]/70" : "border-white/10 hover:border-white/30"
              }`}
              style={{ aspectRatio: "3 / 4", background: "#0a0a0a" }}
              aria-label={`Photo ${i + 1}`}
            >
              <Image src={p} alt="" fill unoptimized className={`object-cover object-top ${isMature ? "blur-md" : ""}`} sizes="64px" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && has && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 sm:p-10"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white text-2xl hover:bg-white/20 transition-colors"
            onClick={() => setLightbox(false)}
            aria-label="Close"
          >
            ×
          </button>

          <div className="relative w-full h-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <Image
              src={safePhotos[current]}
              alt={alt}
              fill
              unoptimized
              className="object-contain"
              sizes="100vw"
            />
          </div>

          {safePhotos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); go(-1) }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 text-white text-3xl hover:bg-white/20 transition-colors"
                aria-label="Previous photo"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); go(1) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 text-white text-3xl hover:bg-white/20 transition-colors"
                aria-label="Next photo"
              >
                ›
              </button>
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                {safePhotos.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setCurrent(i) }}
                    className={`rounded-full transition-all ${i === current ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/40 hover:bg-white/70"}`}
                    aria-label={`Photo ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
