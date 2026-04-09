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
      const orderId = session.metadata?.orderId

      if (!orderId) {
        console.error("No orderId in session metadata")
        return NextResponse.json({ error: "No orderId in metadata" }, { status: 400 })
      }

      const { data: order, error: orderError } = await supabaseAdmin
        .from("orders")
        .select("id, listing_id, quantity")
        .eq("id", orderId)
        .single()

      if (orderError || !order) {
        console.error("Order not found:", orderId)
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }

      // Mark order as PAID
      await supabaseAdmin
        .from("orders")
        .update({ status: "PAID", stripe_session_id: session.id })
        .eq("id", orderId)

      // Decrement stock
      const { data: listing } = await supabaseAdmin
        .from("listings")
        .select("stock")
        .eq("id", order.listing_id)
        .single()

      if (listing) {
        const newStock = listing.stock - order.quantity

        await supabaseAdmin
          .from("listings")
          .update({
            stock: newStock,
            ...(newStock <= 0 ? { active: false } : {}),
          })
          .eq("id", order.listing_id)
      }

      console.log(`Order ${orderId} marked as PAID`)
    } catch (error) {
      console.error("Error processing payment webhook:", error)
      return NextResponse.json({ error: "Failed to process payment" }, { status: 500 })
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.orderId
    if (orderId) {
      await supabaseAdmin
        .from("orders")
        .update({ status: "CANCELLED" })
        .eq("id", orderId)
        .then(({ error }) => {
          if (error) console.error("Error cancelling order:", error)
        })
    }
  }

  return NextResponse.json({ received: true })
}
