import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { supabaseAdmin } from "@/lib/supabase"
import Stripe from "stripe"

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("Webhook signature verification failed:", message)
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session

    try {
      // Extract the verified shipping address Stripe collected from
      // the buyer. The exact field path depends on the API version;
      // try a few in priority order.
      const shippingFromStripe = extractShippingAddress(session)

      // Cart-flow orders are stored with a shared stripe_session_id
      // and no metadata.orderId. Single-listing orders set both. We
      // handle the union: prefer session_id lookup, fall back to
      // metadata.orderId.
      let orders: Array<{ id: string; listing_id: string; quantity: number }> = []

      const { data: bySession } = await supabaseAdmin
        .from("orders")
        .select("id, listing_id, quantity")
        .eq("stripe_session_id", session.id)
      if (bySession && bySession.length > 0) {
        orders = bySession
      } else {
        const metadataOrderId = session.metadata?.orderId
        if (metadataOrderId) {
          const { data } = await supabaseAdmin
            .from("orders")
            .select("id, listing_id, quantity")
            .eq("id", metadataOrderId)
            .single()
          if (data) orders = [data]
        }
      }

      if (orders.length === 0) {
        console.error("No orders found for session", session.id)
        return NextResponse.json({ error: "No orders found" }, { status: 404 })
      }

      // Mark every order in the session as PAID and (if Stripe gave us
      // one) overwrite the shipping address with the Stripe-verified
      // version. Decrement stock per order.
      for (const order of orders) {
        const updates: Record<string, any> = {
          status: "PAID",
          stripe_session_id: session.id,
        }
        if (shippingFromStripe) updates.shipping_address = shippingFromStripe

        await supabaseAdmin.from("orders").update(updates).eq("id", order.id)

        const { data: listing } = await supabaseAdmin
          .from("listings")
          .select("stock")
          .eq("id", order.listing_id)
          .single()
        if (listing) {
          const newStock = listing.stock - (order.quantity ?? 1)
          await supabaseAdmin
            .from("listings")
            .update({
              stock: newStock,
              ...(newStock <= 0 ? { active: false } : {}),
            })
            .eq("id", order.listing_id)
        }
      }

      console.log(
        `[stripe webhook] session ${session.id} → marked ${orders.length} order(s) PAID`
      )
    } catch (error) {
      console.error("Error processing payment webhook:", error)
      return NextResponse.json({ error: "Failed to process payment" }, { status: 500 })
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session

    // Cancel every order tied to this session (cart flow may have many).
    await supabaseAdmin
      .from("orders")
      .update({ status: "CANCELLED" })
      .eq("stripe_session_id", session.id)
      .then(({ error }) => {
        if (error) console.error("Error cancelling orders:", error)
      })

    // Single-flow fallback: legacy orders only carry the metadata.orderId.
    const metadataOrderId = session.metadata?.orderId
    if (metadataOrderId) {
      await supabaseAdmin
        .from("orders")
        .update({ status: "CANCELLED" })
        .eq("id", metadataOrderId)
        .then(({ error }) => {
          if (error) console.error("Error cancelling order by metadata:", error)
        })
    }
  }

  return NextResponse.json({ received: true })
}

/**
 * Pulls the shipping address out of a Checkout Session in a way that
 * tolerates Stripe API version drift. Returns null if Stripe didn't
 * collect one (e.g. the session was created without
 * shipping_address_collection).
 */
function extractShippingAddress(session: Stripe.Checkout.Session): Record<string, any> | null {
  const s = session as unknown as {
    shipping_details?: { name?: string | null; address?: Record<string, any> | null; phone?: string | null }
    collected_information?: { shipping_details?: { name?: string | null; address?: Record<string, any> | null } }
    customer_details?: { name?: string | null; phone?: string | null; address?: Record<string, any> | null }
  }

  const direct = s.shipping_details
  const collected = s.collected_information?.shipping_details
  const fallback = s.customer_details

  const source = direct ?? collected ?? null
  if (source && source.address) {
    return {
      name: source.name ?? fallback?.name ?? null,
      phone: (source as any).phone ?? fallback?.phone ?? null,
      ...source.address,
    }
  }
  if (fallback?.address) {
    return {
      name: fallback.name ?? null,
      phone: fallback.phone ?? null,
      ...fallback.address,
    }
  }
  return null
}
