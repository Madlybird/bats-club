import { ReactNode } from "react"
import BatsOverlay from "@/components/BatsOverlay"
import ScrollReveal from "@/components/ScrollReveal"

/**
 * Shared dark-gradient wrapper for static content pages (FAQ, Terms,
 * Privacy). Matches the archive / shop page header treatment so these
 * pages visually belong to the rest of the site.
 */
export default function InfoPageShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <div className="relative min-h-screen">
      <BatsOverlay />
      <div className="absolute top-1/4 right-1/3 w-[700px] h-[700px] rounded-full bg-[#ff2d78]/5 blur-[180px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-purple-900/6 blur-[120px] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="relative">
        <ScrollReveal>
          <div className="border-b border-white/[0.05]">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
              <span className="inline-block w-8 h-px bg-[#ff2d78] mb-6" />
              <h1
                className="font-black lowercase leading-tight tracking-tighter text-white"
                style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
              >
                {title}
              </h1>
              {subtitle && (
                <p className="text-white/35 mt-3 text-base font-medium">{subtitle}</p>
              )}
            </div>
          </div>
        </ScrollReveal>
        <ScrollReveal>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-10 text-white/70 leading-relaxed">
            {children}
          </div>
        </ScrollReveal>
      </div>
    </div>
  )
}
