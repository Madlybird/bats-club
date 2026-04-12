import { NextResponse } from "next/server"
import Stripe from "stripe"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { stripe } from "@/lib/stripe"
import { getShippingInfo, ALLOWED_COUNTRIES } from "@/lib/shipping"

// In-app promo codes (server-side, applied as a Stripe coupon).
// Stripe-managed promo codes can be applied via the Checkout UI when
// the request doesn't include one of these.
const PROMO_CODES: Record<string, number> = {
  BATSCLUB10: 10, // 10% off total
}

interface CartItem {
  listingId: string
  quantity?: number
}

/**
 * Creates a Stripe Checkout Session for the buyer's cart.
 *
 * Apple Pay and Google Pay are enabled automatically by Stripe when
 * `card` is in `payment_method_types` and the domain is verified —
 * no extra config needed here.
 *
 * If the request supplies an in-app `promoCode`, it's applied as a
 * server-created coupon. Otherwise we set `allow_promotion_codes:
 * true` so the customer can enter Stripe-managed promos in Checkout.
 * (Stripe rejects both options at once.)
 */
export async function POST(req: Request) {
  console.log("ENV CHECK:", {
    hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
    keyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 10),
  })

  // ── Diagnostics ────────────────────────────────────────────────
  // Log a sanitized fingerprint of the secret key on every request
  // so Vercel logs make it obvious whether we're hitting Stripe in
  // live mode, test mode, or with a missing/empty key. We never log
  // the full key.
  const secret = process.env.STRIPE_SECRET_KEY
  const keyMode = !secret
    ? "MISSING"
    : secret.startsWith("sk_live_")
      ? "live"
      : secret.startsWith("sk_test_")
        ? "test"
        : "unknown"
  const keyFingerprint = secret ? `${secret.slice(0, 8)}…${secret.slice(-4)}` : "(none)"
  console.log(`[checkout] STRIPE_SECRET_KEY mode=${keyMode} fingerprint=${keyFingerprint}`)

  if (!secret) {
    return NextResponse.json(
      { error: "STRIPE_SECRET_KEY is not configured on the server" },
      { status: 500 }
    )
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // `stage` tracks how far we got, so the catch block can report
  // exactly which step failed instead of swallowing it as a generic
  // 500. Update it as we cross each milestone.
  let stage: string = "parse-body"

  try {
    const { items, country, promoCode, shippingAddress } = (await req.json()) as {
      items?: CartItem[]
      country?: string
      promoCode?: string
      shippingAddress?: Record<string, string>
    }
    console.log("[checkout] payload", {
      items: items?.length ?? 0,
      country,
      hasPromo: !!promoCode,
      hasAddress: !!shippingAddress,
      buyer: session.user.id,
    })

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 })
    }
    if (!country) {
      return NextResponse.json({ error: "Country is required" }, { status: 400 })
    }

    const shippingInfo = getShippingInfo(country)
    if (shippingInfo.blocked) {
      return NextResponse.json({ error: shippingInfo.blockedMessage }, { status: 400 })
    }

    stage = "fetch-listings"
    const listingIds = items.map((i) => i.listingId)
    const { data: listings, error: listingsError } = await supabaseAdmin
      .from("listings")
      .select("id, price, condition, stock, figure:figures(name, series, scale, imageUrl:image_url)")
      .in("id", listingIds)
      .eq("active", true)

    if (listingsError) {
      console.error("[checkout] supabase listings error:", listingsError)
      throw listingsError
    }
    console.log(`[checkout] fetched ${listings?.length ?? 0}/${listingIds.length} listings`)
    if (!listings || listings.length !== listingIds.length) {
      return NextResponse.json({ error: "One or more items are no longer available" }, { status: 400 })
    }
    for (const listing of listings) {
      const figure = listing.figure as any
      if (listing.stock < 1) {
        return NextResponse.json({ error: `${figure?.name} is out of stock` }, { status: 400 })
      }
    }

    // 40% shipping discount when buying 2+ items in one order.
    // Kept in sync with components/CartPageContent.tsx.
    const multiItemDiscount = listings.length >= 2
    let shippingCents = shippingInfo.priceCents
    if (multiItemDiscount) shippingCents = Math.round(shippingCents * 0.60)

    const itemsSubtotal = listings.reduce((sum, l) => sum + l.price, 0)

    // In-app promo (kept for backwards compat with the old cart UI).
    let promoDiscountCents = 0
    let promoRate = 0
    if (promoCode) {
      const code = String(promoCode).toUpperCase().trim()
      promoRate = PROMO_CODES[code] ?? 0
      if (promoRate > 0) {
        promoDiscountCents = Math.round((itemsSubtotal + shippingCents) * (promoRate / 100))
      }
    }

    // Always use the canonical production domain for Stripe redirect
    // URLs. Preview deployment URLs (e.g. bats-club-xxx.vercel.app)
    // aren't stable and cause errors when Stripe redirects back.
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://batsclub.com"

    const stripeLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = listings.map((listing) => {
      const figure = listing.figure as any
      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: figure.name,
            description: `${figure.series} · ${figure.scale} · ${listing.condition}`,
            images: figure.imageUrl ? [figure.imageUrl] : [],
          },
          unit_amount: listing.price,
        },
        quantity: 1,
      }
    })

    let shippingLabel = `Shipping to ${country}`
    if (multiItemDiscount) shippingLabel += " (15% multi-item discount)"
    stripeLineItems.push({
      price_data: {
        currency: "usd",
        product_data: { name: shippingLabel },
        unit_amount: shippingCents,
      },
      quantity: 1,
    })

    // Build Checkout Session params.
    const params: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: stripeLineItems,
      mode: "payment",
      success_url: `${baseUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cart`,
      customer_email: session.user.email || undefined,
      // Let Stripe collect a verified shipping address — the webhook
      // mirrors it back into the order row as the source of truth.
      shipping_address_collection: {
        allowed_countries: Array.from(ALLOWED_COUNTRIES) as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[],
      },
    }

    if (promoDiscountCents > 0) {
      stage = "create-coupon"
      // In-app coupon path (mutually exclusive with allow_promotion_codes)
      const coupon = await stripe.coupons.create({
        amount_off: promoDiscountCents,
        currency: "usd",
        duration: "once",
        name: `Promo: ${String(promoCode).toUpperCase().trim()} (${promoRate}% off)`,
      })
      params.discounts = [{ coupon: coupon.id }]
    } else {
      params.allow_promotion_codes = true
    }

    // Pack everything the webhook needs into Stripe metadata so we
    // can create order rows AFTER payment is confirmed — not before.
    params.metadata = {
      buyer_id: session.user.id,
      listing_ids: JSON.stringify(listings.map((l) => l.id)),
      listing_prices: JSON.stringify(listings.map((l) => l.price)),
      shipping_cents: String(shippingCents),
      promo_discount_cents: String(promoDiscountCents),
      shipping_address: JSON.stringify(shippingAddress || {}),
    }

    stage = "create-session"
    console.log("[checkout] creating Stripe session", {
      lineItems: params.line_items?.length,
      hasDiscount: !!params.discounts,
      allowPromo: !!params.allow_promotion_codes,
      successUrl: params.success_url,
    })
    const checkoutSession = await stripe.checkout.sessions.create(params)
    console.log(`[checkout] created session id=${checkoutSession.id}`)

    // Orders are NOT created here. They are created in the webhook
    // handler after Stripe confirms payment (checkout.session.completed).

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error: any) {
    // ── Verbose error reporting ─────────────────────────────────
    // Surface as much as we know about the failure: which stage we
    // were in, the Stripe-specific error fields if any, and the raw
    // shape of unknown errors. We send a sanitized subset back to
    // the client so the cart UI can show something more useful than
    // "Failed to create checkout session".
    const isStripeError = error instanceof Stripe.errors.StripeError
    const payload: Record<string, any> = {
      stage,
      message: error?.message ?? String(error),
      name: error?.name,
    }
    if (isStripeError) {
      payload.stripe = {
        type: error.type,
        code: (error as any).code,
        decline_code: (error as any).decline_code,
        param: (error as any).param,
        statusCode: error.statusCode,
        requestId: (error as any).requestId,
        doc_url: (error as any).doc_url,
      }
    }

    console.error("[checkout] FAILED", JSON.stringify(payload, null, 2))
    if (error?.stack) console.error(error.stack)

    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        stage,
        // Forwarded to the cart UI so the user/devtools see what
        // Stripe actually said. Safe to expose: this is the same
        // user-facing message Stripe returns from its dashboard.
        message: payload.message,
        ...(isStripeError && { stripe: payload.stripe }),
      },
      { status: 500 }
    )
  }
}
