import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

/**
 * Looks up an order's total by Stripe Checkout session id — no site
 * session required, so guest checkouts (which never had one) can still
 * report the purchase. The session id itself is the credential: it's
 * a long, Stripe-generated random token, not enumerable, same trust
 * level as the listing UUIDs already exposed on public shop pages.
 *
 * email/delivery_country/estimated_delivery_date were added for the
 * Google Customer Reviews opt-in (rendered client-side on /order/success,
 * see GoogleCustomerReviewsOptIn.tsx) — this is the buyer's own data
 * being returned to the same browser that just completed their own
 * checkout with this session id, not a new exposure beyond what the
 * session id already gates.
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
      listing_id, unit_price, shipping_price, quantity, created_at,
      shipping_address, buyer:users(email),
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

  const first = orders[0] as any
  const email: string | null = first.buyer?.email ?? null
  const deliveryCountry: string | null = first.shipping_address?.country ?? null
  // Not a real shipping promise, just a timer for when Google sends the
  // review survey: order created_at + the transit-time estimate already
  // published in the figure page's ShippingDeliveryTime JSON-LD
  // (handling 1-3d + transit 14-21d, ~24 business days at the high end).
  const estimatedDeliveryDate = first.created_at
    ? new Date(new Date(first.created_at).getTime() + 24 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10)
    : null

  return NextResponse.json({
    currency: "USD",
    value,
    items,
    email,
    deliveryCountry,
    estimatedDeliveryDate,
  })
}
