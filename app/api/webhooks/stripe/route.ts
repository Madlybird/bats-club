import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { stripe } from "@/lib/stripe"
import { supabaseAdmin } from "@/lib/supabase"
import { sendOrderConfirmationEmail } from "@/lib/email"
import Stripe from "stripe"
import bcrypt from "bcryptjs"
import crypto from "crypto"

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
      // Per-listing quantity — art can be ordered in multiples; figures are
      // always 1. Absent on pre-quantity sessions → default to 1 each.
      const listingQuantities: number[] = meta.listing_quantities
        ? JSON.parse(meta.listing_quantities)
        : []
      const qtyAt = (i: number) => Math.max(1, Math.floor(Number(listingQuantities[i] ?? 1)))
      const listingIsDigital: boolean[] = meta.listing_is_digital
        ? JSON.parse(meta.listing_is_digital)
        : []
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

      // Defence-in-depth: metadata is server-set + Stripe-signed so a buyer
      // can't tamper it, but assert it agrees with what Stripe actually
      // charged — catches a future drift bug between the metadata and the
      // Stripe line items before it ships a mis-priced order. Non-blocking:
      // the payment already happened.
      if (session.amount_total != null && listingPrices.length > 0) {
        const expected =
          listingPrices.reduce((s, p, i) => s + (p ?? 0) * qtyAt(i), 0) +
          shippingCents -
          promoDiscountCents
        if (Math.abs(session.amount_total - expected) > 1) {
          console.error(
            `[ALERT] [stripe webhook] amount mismatch session=${session.id} ` +
              `expected=${expected} charged=${session.amount_total} ` +
              `diff=${session.amount_total - expected}`
          )
        }
      }

      // A missing buyerId is now normal — guest checkouts never had a
      // site session. Only the legacy pre-metadata fallback path needs
      // listingIds; buyerId (if absent) gets resolved/created below.
      if (listingIds.length === 0) {
        // Legacy fallback: try existing orders by session id or metadata.orderId
        let orders: Array<{ id: string; listing_id: string; quantity: number; buyer_id: string; status: string }> = []

        const { data: bySession } = await supabaseAdmin
          .from("orders")
          .select("id, listing_id, quantity, buyer_id, status")
          .eq("stripe_session_id", session.id)
        if (bySession && bySession.length > 0) {
          orders = bySession
        } else {
          const metadataOrderId = session.metadata?.orderId
          if (metadataOrderId) {
            const { data } = await supabaseAdmin
              .from("orders")
              .select("id, listing_id, quantity, buyer_id, status")
              .eq("id", metadataOrderId)
              .single()
            if (data) orders = [data]
          }
        }

        if (orders.length > 0) {
          for (const order of orders) {
            // Idempotency: if this order is already PAID, a previous
            // delivery handled it — don't decrement stock again.
            if (order.status === "PAID") {
              console.log(`[stripe webhook] legacy: order ${order.id} already PAID — skipping`)
              continue
            }
            const updates: Record<string, any> = {
              status: "PAID",
              stripe_session_id: session.id,
            }
            if (shippingFromStripe) updates.shipping_address = shippingFromStripe

            await supabaseAdmin.from("orders").update(updates).eq("id", order.id)
            await decrementStock(order.listing_id, order.quantity ?? 1)
            const legacyBuyerId = (order as any).buyer_id || meta.buyer_id
            if (legacyBuyerId) await addFigureToCollection(legacyBuyerId, order.listing_id)
          }
          console.log(`[stripe webhook] legacy: session ${session.id} → marked ${orders.length} order(s) PAID`)
        } else {
          console.error("No orders found and no metadata for session", session.id)
          return NextResponse.json({ error: "No order data found" }, { status: 404 })
        }
      } else {
        // Idempotency guard: Stripe delivers webhooks at-least-once and
        // retries on timeout/5xx. Without this, a retry would insert a
        // second set of orders and decrement stock twice. If orders for
        // this session already exist, we've handled it — ack and return.
        const { data: alreadyProcessed } = await supabaseAdmin
          .from("orders")
          .select("id")
          .eq("stripe_session_id", session.id)
          .limit(1)
        if (alreadyProcessed && alreadyProcessed.length > 0) {
          console.log(`[stripe webhook] session ${session.id} already processed — skipping`)
          return NextResponse.json({ received: true, duplicate: true })
        }

        // Guest checkout: no site session, so no buyer_id came through
        // metadata. Resolve (or create) a user row from the email
        // Stripe itself collected — orders.buyer_id is NOT NULL, and
        // this also gives the guest a normal account they can later
        // claim via "forgot password" if they want to track orders.
        let resolvedBuyerId: string | null = buyerId
        if (!resolvedBuyerId) {
          const guestEmail = session.customer_email || session.customer_details?.email
          const guestName = shippingFromStripe?.name || session.customer_details?.name
          resolvedBuyerId = await resolveOrCreateBuyer(guestEmail, guestName)
          if (!resolvedBuyerId) {
            console.error(
              `[stripe webhook] guest checkout: could not resolve/create buyer for session ${session.id} (email=${guestEmail})`
            )
            return NextResponse.json({ error: "Could not resolve buyer" }, { status: 500 })
          }
          console.log(`[stripe webhook] guest checkout resolved to buyer ${resolvedBuyerId}`)
        }

        // Digital lines: pull their file so we can mint a download token per
        // order below.
        const digitalIds = listingIds.filter((_, i) => listingIsDigital[i])
        const artFileByListing = new Map<string, { path: string; name: string | null }>()
        if (digitalIds.length > 0) {
          const { data: fileRows } = await supabaseAdmin
            .from("listings")
            .select("id, art:art(file_path, file_name)")
            .in("id", digitalIds)
          for (const r of (fileRows || []) as any[]) {
            const art = Array.isArray(r.art) ? r.art[0] : r.art
            if (art?.file_path) artFileByListing.set(r.id, { path: art.file_path, name: art.file_name ?? null })
          }
        }
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://batsclub.com"
        const downloadLinks: string[] = []

        // New flow: create orders NOW (after payment confirmed)
        for (let i = 0; i < listingIds.length; i++) {
          const listingId = listingIds[i]
          const price = listingPrices[i] ?? 0
          const digital = !!listingIsDigital[i]
          const quantity = digital ? 1 : qtyAt(i)
          const finalShippingAddress = shippingFromStripe || shippingAddress

          const orderRow = {
            buyer_id: resolvedBuyerId,
            listing_id: listingId,
            status: "PAID",
            shipping_address: finalShippingAddress,
            unit_price: price,
            shipping_price: i === 0 ? shippingCents - promoDiscountCents : 0,
            quantity,
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
            // 23505 = unique violation on (stripe_session_id, listing_id):
            // a concurrent delivery already created this order. Treat as
            // already-processed — skip stock/collection so we don't
            // double-count. (Requires migration 008.)
            if ((insertError as any).code === "23505") {
              console.log(
                `[stripe webhook] order for session=${session.id} listing=${listingId} already exists — skipping`,
              )
              continue
            }
            console.error(`[stripe webhook] order insert ${i} failed:`, insertError)
            throw insertError
          }
          console.log(`[stripe webhook] order ${inserted?.id} created (PAID) qty=${quantity}${digital ? " digital" : ""}`)

          if (digital) {
            // Digital: no stock to decrement; mint a 7-day download token.
            const file = artFileByListing.get(listingId)
            if (file) {
              const token = crypto.randomBytes(32).toString("base64url")
              const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
              const { error: dlErr } = await supabaseAdmin.from("digital_downloads").insert({
                token,
                order_id: inserted?.id ?? session.id,
                listing_id: listingId,
                file_path: file.path,
                file_name: file.name,
                expires_at: expiresAt,
              })
              if (dlErr) {
                console.error(`[stripe webhook] digital_downloads insert failed for ${listingId}:`, dlErr)
              } else {
                downloadLinks.push(`${baseUrl}/api/download/${token}`)
              }
            } else {
              console.error(
                `[ALERT] [stripe webhook] digital listing ${listingId} has no file — buyer paid, no download issued.`
              )
            }
          } else {
            await decrementStock(listingId, quantity)
          }
          await addFigureToCollection(resolvedBuyerId, listingId)
        }

        console.log(
          `[stripe webhook] session ${session.id} → created ${listingIds.length} order(s) as PAID`
        )

        // Force the sold listing's own detail page to refetch immediately
        // so it stops showing as in-stock. /shop and /archive are already
        // force-dynamic (no ISR cache), so revalidating them here is a
        // no-op — they always read live on every request.
        try {
          for (const listingId of listingIds) {
            revalidatePath(`/shop/${listingId}`)
            revalidatePath(`/ru/shop/${listingId}`)
            revalidatePath(`/jp/shop/${listingId}`)
          }
          console.log("[stripe webhook] revalidated shop listing paths")
        } catch (e) {
          console.error("[stripe webhook] revalidate failed:", e)
        }

        // Send order confirmation email
        const buyerEmail = session.customer_email || session.customer_details?.email
        if (buyerEmail) {
          // Fetch figure names for the email
          const { data: figureData } = await supabaseAdmin
            .from("listings")
            .select("figure:figures(name), art:art(title)")
            .in("id", listingIds)
          const figureNames = (figureData || [])
            .map((l: any) => l.figure?.name || l.art?.title)
            .filter(Boolean)
            .join(", ")
          const totalPrice = listingPrices.reduce(
            (sum: number, p: number, i: number) => sum + (p ?? 0) * qtyAt(i),
            0
          )
          const country = (shippingFromStripe as any)?.country || (shippingAddress as any)?.country || "—"
          await sendOrderConfirmationEmail(
            buyerEmail,
            figureNames,
            totalPrice,
            country,
            downloadLinks
          ).catch((err: any) => console.error("[stripe webhook] order email failed:", err))
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
  // Atomic: `decrement_stock` (migration 011) does the whole thing in one
  // statement with a `stock >= qty` guard, so two concurrent webhooks for the
  // same listing can't both read the old value and oversell. It de-lists a
  // sold-out figure and leaves sold-out art active (same rule as before).
  const { data, error } = await supabaseAdmin.rpc("decrement_stock", {
    p_listing_id: listingId,
    p_qty: quantity,
  })
  if (error) {
    console.error(`[stripe webhook] decrement_stock RPC failed for ${listingId}:`, error)
    return
  }
  if (data === null) {
    // The `stock >= qty` guard didn't match — not enough stock at the moment
    // the payment settled. The payment already succeeded, so the order stands;
    // flag it for a manual refund / restock.
    console.error(
      `[ALERT] [stripe webhook] OVERSOLD: listing ${listingId} could not be decremented by ` +
        `${quantity} (insufficient stock at settlement). Order was paid — refund or restock.`
    )
    return
  }
  console.log(`[stripe webhook] listing ${listingId} stock=${data}`)
}

/**
 * Finds an existing user by email, or creates a lightweight guest
 * account for them. The account gets an unguessable random password
 * (bcrypt hash of 24 random bytes — nobody knows it, including us) so
 * it can't be logged into directly; the guest can later set a real
 * password via the normal "forgot password" flow if they want to
 * track orders under this email.
 */
async function resolveOrCreateBuyer(
  email: string | null | undefined,
  name?: string | null
): Promise<string | null> {
  if (!email) return null

  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle()
  if (existing) return existing.id

  const usernameBase =
    email.split("@")[0].replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 20) || "guest"

  // A couple of retries covers username collisions; an email collision
  // (a concurrent webhook delivery for the same buyer) is resolved by
  // re-selecting instead of retrying the insert.
  for (let attempt = 0; attempt < 5; attempt++) {
    const username = attempt === 0 ? usernameBase : `${usernameBase}-${crypto.randomInt(1000, 9999)}`
    const randomPassword = await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 12)
    const { data: created, error } = await supabaseAdmin
      .from("users")
      .insert({
        email,
        name: name?.trim() || usernameBase,
        username,
        password: randomPassword,
        email_verified: false,
      })
      .select("id")
      .single()
    if (!error && created) return created.id

    if ((error as any)?.code === "23505") {
      const { data: raceWinner } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", email)
        .maybeSingle()
      if (raceWinner) return raceWinner.id
      // Not an email collision — must've been the username. Loop and retry.
      continue
    }

    console.error("[stripe webhook] resolveOrCreateBuyer insert failed:", error)
    return null
  }
  return null
}

/**
 * Adds the purchased figure to the buyer's `HAVE` collection. Looks
 * up the figure_id from the listing and upserts on (user_id,
 * figure_id), so re-buying or already-owned doesn't duplicate the
 * row but does promote a WISHLIST/BUY entry to HAVE.
 */
async function addFigureToCollection(userId: string, listingId: string) {
  const { data: listing, error: listingError } = await supabaseAdmin
    .from("listings")
    .select("figure_id")
    .eq("id", listingId)
    .single()
  if (listingError) {
    console.error(`[stripe webhook] addFigureToCollection: listing ${listingId} lookup failed:`, listingError)
    return
  }
  // Art listings have no figure_id — there's no figure collection to add
  // them to. Expected, not an error.
  if (!listing?.figure_id) return
  const { error: upsertError } = await supabaseAdmin
    .from("user_figures")
    .upsert(
      { user_id: userId, figure_id: listing.figure_id, status: "HAVE" },
      { onConflict: "user_id,figure_id" }
    )
  if (upsertError) {
    console.error(
      `[stripe webhook] addFigureToCollection upsert failed for user=${userId} figure=${listing.figure_id}:`,
      upsertError
    )
    return
  }
  console.log(
    `[stripe webhook] user_figures user=${userId} figure=${listing.figure_id} status=HAVE`
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
