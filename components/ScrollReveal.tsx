"use client"

import { useEffect, useRef, ReactNode } from "react"

export default function ScrollReveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // threshold: 0 — fire as soon as ANY pixel of the element is in
    // the viewport. The previous 0.08 threshold required 8% of the
    // element's area to be visible at once, which is physically
    // impossible for very tall reveals (e.g. the 9000+px
    // <ArchiveClient> grid on /archive) on phone-sized viewports —
    // max visible ratio on an iPhone SE is ~6.5%, so the observer
    // never fired and the whole archive stayed at opacity:0. The
    // entry.isIntersecting guard below still prevents false-positives.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            el.classList.add("reveal-visible")
          }, delay)
          observer.unobserve(el)
        }
      },
      { threshold: 0 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  return (
    <div ref={ref} className={`reveal ${className ?? ""}`}>
      {children}
    </div>
  )
}
