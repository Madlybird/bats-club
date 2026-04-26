import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { stripe } from "@/lib/stripe"
import { supabaseAdmin } from "@/lib/supabase"
import { sendOrderConfirmationEmail } from "@/lib/email"
import Stripe from "stripe"

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")
  console.log("[stripe webhook] received request", {
    hasSig: !!sig,
    bodyLen: body.length,
    hasSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
  })

  if (!sig) {
    console.error("[stripe webhook] missing stripe-signature header")
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
    console.log(`[stripe webhook] event verified: ${event.type} (id=${event.id})`)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[stripe webhook] signature verification failed:", message)
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    console.log(`[stripe webhook] processing session ${session.id}`, {
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total,
      hasMetadata: !!session.metadata && Object.keys(session.metadata).length > 0,
      metadataKeys: Object.keys(session.metadata || {}),
    })

    try {
      const shippingFromStripe = extractShippingAddress(session)
      const meta = session.metadata || {}

      const buyerId = meta.buyer_id
      const listingIds: string[] = meta.listing_ids ? JSON.parse(meta.listing_ids) : []
      const listingPrices: number[] = meta.listing_prices ? JSON.parse(meta.listing_prices) : []
      const shippingCents = Number(meta.shipping_cents || "0")
      const promoDiscountCents = Number(meta.promo_discount_cents || "0")
      const shippingAddress = meta.shipping_address ? JSON.parse(meta.shipping_address) : {}

      console.log("[stripe webhook] parsed metadata", {
        buyerId,
        listingIds,
        listingPrices,
        shippingCents,
        promoDiscountCents,
        hasShippingFromStripe: !!shippingFromStripe,
      })

      if (!buyerId || listingIds.length === 0) {
        // Legacy fallback: try existing orders by session id or metadata.orderId
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

        if (orders.length > 0) {
          for (const order of orders) {
            const updates: Record<string, any> = {
              status: "PAID",
              stripe_session_id: session.id,
            }
            if (shippingFromStripe) updates.shipping_address = shippingFromStripe

            await supabaseAdmin.from("orders").update(updates).eq("id", order.id)
            await decrementStock(order.listing_id, order.quantity ?? 1)
          }
          console.log(`[stripe webhook] legacy: session ${session.id} → marked ${orders.length} order(s) PAID`)
          try {
            revalidatePath("/shop")
            revalidatePath("/ru/shop")
            revalidatePath("/jp/shop")
            revalidatePath("/archive")
            revalidatePath("/ru/archive")
            revalidatePath("/jp/archive")
          } catch (e) {
            console.error("[stripe webhook] legacy revalidate failed:", e)
          }
        } else {
          console.error("No orders found and no metadata for session", session.id)
          return NextResponse.json({ error: "No order data found" }, { status: 404 })
        }
      } else {
        // New flow: create orders NOW (after payment confirmed)
        for (let i = 0; i < listingIds.length; i++) {
          const listingId = listingIds[i]
          const price = listingPrices[i] ?? 0
          const finalShippingAddress = shippingFromStripe || shippingAddress

          const orderRow = {
            buyer_id: buyerId,
            listing_id: listingId,
            status: "PAID",
            shipping_address: finalShippingAddress,
            unit_price: price,
            shipping_price: i === 0 ? shippingCents - promoDiscountCents : 0,
            quantity: 1,
            stripe_session_id: session.id,
          }
          console.log(`[stripe webhook] inserting order ${i + 1}/${listingIds.length}`, {
            buyer_id: orderRow.buyer_id,
            listing_id: orderRow.listing_id,
            unit_price: orderRow.unit_price,
            shipping_price: orderRow.shipping_price,
            hasShippingAddress:
              !!orderRow.shipping_address && Object.keys(orderRow.shipping_address).length > 0,
          })
          const { data: inserted, error: insertError } = await supabaseAdmin
            .from("orders")
            .insert(orderRow)
            .select("id")
            .single()
          if (insertError) {
            console.error(`[stripe webhook] order insert ${i} failed:`, insertError)
            throw insertError
          }
          console.log(`[stripe webhook] order ${inserted?.id} created (PAID)`)

          await decrementStock(listingId, 1)
        }

        console.log(
          `[stripe webhook] session ${session.id} → created ${listingIds.length} order(s) as PAID`
        )

        // Force shop and archive to refetch immediately so the sold
        // listing disappears from the public catalog.
        try {
          revalidatePath("/shop")
          revalidatePath("/ru/shop")
          revalidatePath("/jp/shop")
          revalidatePath("/archive")
          revalidatePath("/ru/archive")
          revalidatePath("/jp/archive")
          for (const listingId of listingIds) {
            revalidatePath(`/shop/${listingId}`)
            revalidatePath(`/ru/shop/${listingId}`)
            revalidatePath(`/jp/shop/${listingId}`)
          }
          console.log("[stripe webhook] revalidated shop + archive paths")
        } catch (e) {
          console.error("[stripe webhook] revalidate failed:", e)
        }

        // Send order confirmation email
        const buyerEmail = session.customer_email || session.customer_details?.email
        if (buyerEmail) {
          // Fetch figure names for the email
          const { data: figureData } = await supabaseAdmin
            .from("listings")
            .select("figure:figures(name)")
            .in("id", listingIds)
          const figureNames = (figureData || []).map((l: any) => l.figure?.name).filter(Boolean).join(", ")
          const totalPrice = listingPrices.reduce((a: number, b: number) => a + b, 0)
          const country = (shippingFromStripe as any)?.country || (shippingAddress as any)?.country || "—"
          await sendOrderConfirmationEmail(buyerEmail, figureNames, totalPrice, country).catch((err: any) =>
            console.error("[stripe webhook] order email failed:", err)
          )
        }
      }
    } catch (error) {
      console.error("Error processing payment webhook:", error)
      return NextResponse.json({ error: "Failed to process payment" }, { status: 500 })
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session

    // Cancel any legacy orders tied to this session
    await supabaseAdmin
      .from("orders")
      .update({ status: "CANCELLED" })
      .eq("stripe_session_id", session.id)
      .then(({ error }) => {
        if (error) console.error("Error cancelling orders:", error)
      })

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

async function decrementStock(listingId: string, quantity: number) {
  const { data: listing, error: fetchError } = await supabaseAdmin
    .from("listings")
    .select("stock")
    .eq("id", listingId)
    .single()
  if (fetchError || !listing) {
    console.error(`[stripe webhook] decrementStock fetch failed for ${listingId}:`, fetchError)
    return
  }
  const newStock = Math.max(0, listing.stock - quantity)
  const update: Record<string, any> = { stock: newStock }
  if (newStock <= 0) update.active = false
  const { error: updateError } = await supabaseAdmin
    .from("listings")
    .update(update)
    .eq("id", listingId)
  if (updateError) {
    console.error(`[stripe webhook] decrementStock update failed for ${listingId}:`, updateError)
    return
  }
  console.log(
    `[stripe webhook] listing ${listingId} stock=${newStock}${newStock <= 0 ? " active=false" : ""}`
  )
}

/**
 * Pulls the shipping address out of a Checkout Session in a way that
 * tolerates Stripe API version drift.
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
