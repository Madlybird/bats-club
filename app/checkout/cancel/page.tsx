import Link from "next/link"

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-[#080810] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.04),transparent_70%)]" />

      <div className="relative w-full max-w-md text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-red-900/20 border border-red-800/50 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-black text-slate-100 mb-2">Payment Cancelled</h1>
        <p className="text-slate-400 mb-8 leading-relaxed">
          No worries! Your payment was cancelled and you haven&apos;t been charged.
          The items are still available in the shop.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/shop" className="btn-primary">
            Back to Shop
          </Link>
          <Link href="/" className="btn-ghost">
            Browse Archive
          </Link>
        </div>
      </div>
    </div>
  )
}
