"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "@/components/SiteImage"
import { AgeGateReveal, type AgeGateLabels } from "@/components/AgeGate"

interface Props {
  photos: string[]
  alt: string
  isMature: boolean
  ageGateLabels: AgeGateLabels
  backHref: string
  zoomHint: string
}

// True when (x, y) lands on the visible picture of an object-contain <img>,
// not on the transparent letterbox around it.
function hitsContainedImage(img: HTMLImageElement, x: number, y: number): boolean {
  const r = img.getBoundingClientRect()
  const nw = img.naturalWidth
  const nh = img.naturalHeight
  if (!nw || !nh) return true
  const scale = Math.min(r.width / nw, r.height / nh)
  const w = nw * scale
  const h = nh * scale
  const left = r.left + (r.width - w) / 2
  const top = r.top + (r.height - h) / 2
  return x >= left && x <= left + w && y >= top && y <= top + h
}

// Pinch-zoomed in: one-finger drags pan the view instead of swiping.
const isZoomed = () => (window.visualViewport?.scale ?? 1) > 1.01

const SWIPE_MIN = 50 // px of horizontal travel before a swipe changes photo
const DISMISS_MIN = 90 // px of downward drag that closes the lightbox

// Left column of /art/[id]: 3:4 cover frame + thumbnail strip. Clicking the
// main image opens a full-size lightbox over the listing (object-contain so
// the whole print is visible). Navigation: arrows/keys/dots and horizontal
// swipe; close: ×, Esc, tap outside the picture, swipe down, or Back.
export default function ArtGallery({ photos, alt, isMature, ageGateLabels, backHref, zoomHint }: Props) {
  const [current, setCurrent] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const [dragY, setDragY] = useState(0)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const suppressClickRef = useRef(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  const safePhotos = photos.length > 0 ? photos : []
  const has = safePhotos.length > 0

  const go = useCallback(
    (dir: number) => {
      if (safePhotos.length < 2) return
      setCurrent((c) => (c + dir + safePhotos.length) % safePhotos.length)
    },
    [safePhotos.length],
  )

  // The lightbox owns a history entry so the phone's Back button / back
  // swipe closes the photo instead of leaving the listing.
  const open = () => {
    if (!has) return
    window.history.pushState({ ...window.history.state, artLightbox: true }, "")
    setLightbox(true)
  }
  // history.back() is async, so a second close() before popstate lands
  // (e.g. swipe-down followed by its synthetic click) would pop the
  // listing itself — closingRef makes close() fire once.
  const closingRef = useRef(false)
  const close = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true
    if (window.history.state?.artLightbox) window.history.back()
    else setLightbox(false)
  }, [])

  useEffect(() => {
    if (!lightbox) return
    closingRef.current = false
    const onPop = () => setLightbox(false)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
      if (e.key === "ArrowLeft") go(-1)
      if (e.key === "ArrowRight") go(1)
    }
    // One-finger drags are our swipes: cancel the native gesture so the
    // browser doesn't start a fling, which would eat the next tap (e.g. on
    // ×) to stop it. Needs a non-passive listener; React's are passive.
    // Pinch and panning a pinch-zoomed view stay native.
    const overlay = overlayRef.current
    const onNativeMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && !isZoomed()) e.preventDefault()
    }
    overlay?.addEventListener("touchmove", onNativeMove, { passive: false })
    window.addEventListener("popstate", onPop)
    window.addEventListener("keydown", onKey)
    // Lock body scroll while the lightbox is open.
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      overlay?.removeEventListener("touchmove", onNativeMove)
      window.removeEventListener("popstate", onPop)
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [lightbox, go, close])

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1 || isZoomed()) {
      touchStart.current = null // pinch / zoomed pan — leave it to the browser
      setDragY(0)
      return
    }
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    suppressClickRef.current = false
  }
  const onTouchMove = (e: React.TouchEvent) => {
    const s = touchStart.current
    if (!s || e.touches.length !== 1) return
    const dx = e.touches[0].clientX - s.x
    const dy = e.touches[0].clientY - s.y
    setDragY(dy > 0 && dy > Math.abs(dx) ? dy : 0)
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = touchStart.current
    touchStart.current = null
    setDragY(0)
    if (!s) return
    const dx = e.changedTouches[0].clientX - s.x
    const dy = e.changedTouches[0].clientY - s.y
    // Any real drag must not also count as a tap on the backdrop.
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) suppressClickRef.current = true
    if (dy > DISMISS_MIN && dy > Math.abs(dx)) close()
    else if (Math.abs(dx) > SWIPE_MIN && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1)
  }

  const onBackdropClick = (e: React.MouseEvent) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }
    const t = e.target
    if (t instanceof HTMLImageElement && hitsContainedImage(t, e.clientX, e.clientY)) return
    close()
  }

  const ctrl =
    "z-10 flex items-center justify-center rounded-full bg-black/50 text-white border border-white/15 hover:bg-white/20 transition-colors"

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
          onClick={open}
          className="group relative block w-full cursor-zoom-in"
          style={{ aspectRatio: "3 / 4", background: "#0a0a0a" }}
          aria-label={zoomHint}
        >
          {has ? (
            <Image
              src={safePhotos[current]}
              alt={alt}
              fill
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
              <Image src={p} alt="" fill className={`object-cover object-top ${isMature ? "blur-md" : ""}`} sizes="64px" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox — controls sit above the full-size picture (z-10) so the
          picture can never swallow taps meant for them. */}
      {lightbox && has && (
        <div
          ref={overlayRef}
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-10 overscroll-contain backdrop-blur-sm"
          style={{
            touchAction: "pinch-zoom",
            background: `rgba(0,0,0,${0.9 * Math.max(0.3, 1 - dragY / 400)})`,
          }}
          onClick={onBackdropClick}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div
            className="relative w-full h-full max-w-5xl"
            style={{
              transform: dragY ? `translateY(${dragY}px)` : undefined,
              transition: dragY ? "none" : "transform 200ms ease",
            }}
          >
            <Image
              src={safePhotos[current]}
              alt={alt}
              fill
              className="object-contain select-none"
              sizes="100vw"
              draggable={false}
            />
          </div>

          {safePhotos.length > 1 && (
            <span
              className="absolute left-4 z-10 badge bg-black/50 text-white/80 border border-white/15 text-xs tabular-nums"
              style={{ top: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}
            >
              {current + 1} / {safePhotos.length}
            </span>
          )}

          <button
            type="button"
            className={`absolute right-3 w-11 h-11 text-2xl ${ctrl}`}
            style={{ top: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}
            onClick={(e) => { e.stopPropagation(); close() }}
            aria-label="Close"
          >
            ×
          </button>

          {safePhotos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); go(-1) }}
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 text-3xl ${ctrl}`}
                aria-label="Previous photo"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); go(1) }}
                className={`absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 text-3xl ${ctrl}`}
                aria-label="Next photo"
              >
                ›
              </button>
              <div
                className="absolute left-0 right-0 z-10 flex justify-center gap-1"
                style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
              >
                {safePhotos.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setCurrent(i) }}
                    className="p-2"
                    aria-label={`Photo ${i + 1}`}
                  >
                    <span
                      className={`block rounded-full transition-all ${i === current ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/40"}`}
                    />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
