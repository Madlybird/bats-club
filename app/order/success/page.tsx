import Link from "next/link"
import type { Metadata } from "next"
import BatsOverlay from "@/components/BatsOverlay"
import ClearCartOnMount from "@/components/ClearCartOnMount"

export const metadata: Metadata = {
  title: "Order Confirmed | Bats Club",
  description: "Thank you for your order at Bats Club.",
}

// Render fresh on every visit so the cart-clearing effect always runs.
export const dynamic = "force-dynamic"

export default function OrderSuccessPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-16 overflow-hidden">
      <BatsOverlay />
      <ClearCartOnMount />

      {/* ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-[#ff2d78]/8 blur-[180px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-purple-900/8 blur-[140px] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 w-full max-w-md text-center">
        {/* Pink checkmark */}
        <div className="flex justify-center mb-8">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(255,45,120,0.35)]"
            style={{ background: "linear-gradient(135deg, #ff2d78, #7c3aed)" }}
          >
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black lowercase tracking-tighter text-white mb-4">
          order confirmed!
        </h1>
        <p className="text-white/50 text-base leading-relaxed mb-10 max-w-sm mx-auto">
          Thank you for your purchase. We&apos;ll contact you via email with shipping details.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/archive"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full font-bold text-white text-sm transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #ff2d78, #7c3aed)" }}
          >
            Back to Archive
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full font-bold text-sm border border-white/15 text-white/70 hover:text-white hover:border-white/30 transition-all"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
