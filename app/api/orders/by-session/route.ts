import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

/**
 * Looks up an order's total by Stripe Checkout session id — no site
 * session required, so guest checkouts (which never had one) can still
 * report the purchase. The session id itself is the credential: it's
 * a long, Stripe-generated random token, not enumerable, same trust
 * level as the listing UUIDs already exposed on public shop pages.
 * Response is intentionally minimal (no buyer/email/shipping) since
 * this route has no auth check.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get("session_id")
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 })
  }

  const { data: orders, error } = await supabaseAdmin
    .from("orders")
    .select(`
      listing_id, unit_price, shipping_price, quantity,
      listing:listings(figure:figures(name))
    `)
    .eq("stripe_session_id", sessionId)
    .eq("status", "PAID")

  if (error) {
    console.error("[orders/by-session] lookup failed:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }

  if (!orders || orders.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const items = orders.map((o: any) => ({
    item_id: o.listing_id,
    item_name: o.listing?.figure?.name || o.listing_id,
    price: (o.unit_price ?? 0) / 100,
    quantity: o.quantity ?? 1,
  }))
  const value = orders.reduce(
    (sum: number, o: any) => sum + (o.unit_price ?? 0) * (o.quantity ?? 1) + (o.shipping_price ?? 0),
    0
  ) / 100

  return NextResponse.json({ currency: "USD", value, items })
}
