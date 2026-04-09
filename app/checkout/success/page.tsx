import { supabaseAdmin } from "@/lib/supabase"
import Link from "next/link"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

interface Props { searchParams: { session_id?: string } }

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions)
  const { session_id } = searchParams

  let order: any = null
  if (session_id) {
    const { data } = await supabaseAdmin
      .from("orders")
      .select(`
        id, status, quantity,
        unitPrice:unit_price, shippingPrice:shipping_price,
        shippingAddress:shipping_address,
        listing:listings(figure:figures(name))
      `)
      .eq("stripe_session_id", session_id)
      .single()
    order = data
  }

  const shippingDisplay = order?.shippingAddress
    ? (typeof order.shippingAddress === "string"
        ? order.shippingAddress
        : JSON.stringify(order.shippingAddress))
    : null

  return (
    <div className="min-h-screen bg-[#080810] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.06),transparent_70%)]" />
      <div className="relative w-full max-w-lg text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-emerald-900/30 border border-emerald-700/50 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h1 className="text-4xl font-black text-slate-100 mb-2">Payment Successful! 🎉</h1>
        <p className="text-slate-400 text-lg mb-8">Your order has been placed and is being processed.</p>
        {order ? (
          <div className="card p-6 text-left mb-8 space-y-4">
            <h2 className="font-bold text-slate-100 text-lg border-b border-[#1a1a3a] pb-3">Order Details</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Order ID</span>
                <span className="text-slate-300 font-mono text-xs">{order.id.slice(0, 16)}...</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Figure</span>
                <span className="text-slate-300">{(order.listing as any)?.figure?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Quantity</span>
                <span className="text-slate-300">{order.quantity}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Unit Price</span>
                <span className="text-slate-300">${(order.unitPrice / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Shipping</span>
                <span className="text-slate-300">${(order.shippingPrice / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-[#1a1a3a] font-bold">
                <span className="text-slate-300">Total</span>
                <span className="text-violet-400">
                  ${((order.unitPrice * order.quantity + order.shippingPrice) / 100).toFixed(2)}
                </span>
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-500">Status: </span>
              <span className="badge badge-blue ml-1">{order.status}</span>
            </div>
            {shippingDisplay && (
              <div>
                <span className="text-xs text-slate-500">Shipping to: </span>
                <p className="text-sm text-slate-300 mt-0.5">{shippingDisplay}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="card p-6 mb-8">
            <p className="text-slate-400 text-sm">Your order is being processed. You&apos;ll receive a confirmation shortly.</p>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {session && (
            <Link href={`/profile/${session.user.username}`} className="btn-primary">View My Profile</Link>
          )}
          <Link href="/shop" className="btn-ghost">Continue Shopping</Link>
        </div>
      </div>
    </div>
  )
}
