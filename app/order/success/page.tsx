import { supabaseAdmin } from "@/lib/supabase"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Order Confirmed | Bats Club",
  description: "Thank you for your order at Bats Club.",
}

// Order details depend on the live Stripe webhook firing first.
// Don't cache this page — render fresh every time.
export const dynamic = "force-dynamic"

interface Props {
  searchParams: { session_id?: string }
}

interface OrderRow {
  id: string
  status: string
  quantity: number
  unitPrice: number
  shippingPrice: number
  shippingAddress: any
  listing: {
    id: string
    figure: { name: string; series: string; scale: string; imageUrl: string | null } | null
  } | null
}

export default async function OrderSuccessPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions)
  const sessionId = searchParams.session_id

  let orders: OrderRow[] = []
  if (sessionId) {
    const { data } = await supabaseAdmin
      .from("orders")
      .select(`
        id, status, quantity,
        unitPrice:unit_price, shippingPrice:shipping_price,
        shippingAddress:shipping_address,
        listing:listings(
          id,
          figure:figures(name, series, scale, imageUrl:image_url)
        )
      `)
      .eq("stripe_session_id", sessionId)
      .order("created_at", { ascending: true })
    orders = (data as any) || []
  }

  const itemsTotal = orders.reduce((sum, o) => sum + o.unitPrice * (o.quantity ?? 1), 0)
  const shippingTotal = orders.reduce((sum, o) => sum + (o.shippingPrice ?? 0), 0)
  const grandTotal = itemsTotal + shippingTotal

  // Shipping address is mirrored to every order in the session by the
  // webhook — read it off the first row.
  const shipping = orders[0]?.shippingAddress
  const shippingLines = formatShippingAddress(shipping)

  return (
    <div className="min-h-screen bg-[#080810] flex items-start justify-center px-4 py-16">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.06),transparent_70%)] pointer-events-none" />
      <div className="relative w-full max-w-2xl">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-emerald-900/30 border border-emerald-700/50 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-black text-slate-100 mb-2">Thank you! 🎉</h1>
          <p className="text-slate-400 text-lg">
            Your order is confirmed. We&apos;ll email you a receipt and shipping updates.
          </p>
        </div>

        {orders.length > 0 ? (
          <div className="card p-6 space-y-6">
            <div>
              <h2 className="font-bold text-slate-100 text-lg border-b border-[#1a1a3a] pb-3 mb-4">
                Your items
              </h2>
              <ul className="space-y-4">
                {orders.map((order) => {
                  const figure = order.listing?.figure
                  return (
                    <li key={order.id} className="flex gap-4">
                      <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-[#1a1a3a] bg-[#0a0a12]">
                        {figure?.imageUrl ? (
                          <Image
                            src={figure.imageUrl}
                            alt={figure.name}
                            fill
                            sizes="64px"
                            className="object-cover object-top"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-2xl opacity-30">🦇</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-200 font-medium truncate">{figure?.name ?? "Figure"}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {figure?.series}{figure?.scale ? ` · ${figure.scale}` : ""}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 font-mono">#{order.id.slice(0, 8)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-200 font-medium">
                          ${(order.unitPrice / 100).toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-500">qty {order.quantity ?? 1}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>

            <div className="border-t border-[#1a1a3a] pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Items subtotal</span>
                <span className="text-slate-300">${(itemsTotal / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Shipping</span>
                <span className="text-slate-300">${(shippingTotal / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base pt-2 border-t border-[#1a1a3a] font-bold">
                <span className="text-slate-200">Total</span>
                <span className="text-violet-400">${(grandTotal / 100).toFixed(2)}</span>
              </div>
            </div>

            {shippingLines.length > 0 && (
              <div className="border-t border-[#1a1a3a] pt-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2">
                  Shipping to
                </p>
                <address className="not-italic text-sm text-slate-300 leading-relaxed">
                  {shippingLines.map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </address>
              </div>
            )}

            <div>
              <span className="text-xs text-slate-500">Order status: </span>
              <span className="badge badge-blue ml-1">{orders[0]?.status}</span>
            </div>
          </div>
        ) : (
          <div className="card p-6 text-center">
            <p className="text-slate-400 text-sm">
              Your order is being processed. You&apos;ll receive a confirmation by email shortly.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          {session?.user?.username && (
            <Link href={`/profile/${session.user.username}`} className="btn-primary">
              View my profile
            </Link>
          )}
          <Link href="/shop" className="btn-ghost">
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  )
}

function formatShippingAddress(addr: any): string[] {
  if (!addr || typeof addr !== "object") return []
  const lines: string[] = []
  const name = addr.name ?? addr.fullName
  if (name) lines.push(String(name))
  const line1 = addr.line1 ?? addr.addressLine1
  if (line1) lines.push(String(line1))
  const line2 = addr.line2 ?? addr.addressLine2
  if (line2) lines.push(String(line2))
  const cityLine = [addr.city, addr.state, addr.postal_code ?? addr.zip]
    .filter(Boolean)
    .join(", ")
  if (cityLine) lines.push(cityLine)
  if (addr.country) lines.push(String(addr.country))
  if (addr.phone) lines.push(String(addr.phone))
  return lines
}
