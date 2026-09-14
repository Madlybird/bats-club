import { ReactNode } from "react"

// Fade/translate-in-on-scroll was removed site-wide — it read as a slow,
// half-visible page on first load (worst on tall content like the
// archive grid) instead of adding anything. Kept as a passthrough so
// none of the 15 call sites need to change.
export default function ScrollReveal({
  children,
  className,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  return <div className={className}>{children}</div>
}
