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
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { items, country, promoCode, shippingAddress } = (await req.json()) as {
      items?: CartItem[]
      country?: string
      promoCode?: string
      shippingAddress?: Record<string, string>
    }

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

    const listingIds = items.map((i) => i.listingId)
    const { data: listings, error: listingsError } = await supabaseAdmin
      .from("listings")
      .select("id, price, condition, stock, figure:figures(name, series, scale, imageUrl:image_url)")
      .in("id", listingIds)
      .eq("active", true)

    if (listingsError) throw listingsError
    if (!listings || listings.length !== listingIds.length) {
      return NextResponse.json({ error: "One or more items are no longer available" }, { status: 400 })
    }
    for (const listing of listings) {
      const figure = listing.figure as any
      if (listing.stock < 1) {
        return NextResponse.json({ error: `${figure?.name} is out of stock` }, { status: 400 })
      }
    }

    // 15% shipping discount when buying 2+ items in one order
    const multiItemDiscount = listings.length >= 2
    let shippingCents = shippingInfo.priceCents
    if (multiItemDiscount) shippingCents = Math.round(shippingCents * 0.85)

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

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000"

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

    const checkoutSession = await stripe.checkout.sessions.create(params)

    // Create one Order row per listing, all sharing the same
    // stripe_session_id so the webhook can fan out and mark them PAID.
    for (let i = 0; i < listings.length; i++) {
      const listing = listings[i]
      await supabaseAdmin.from("orders").insert({
        buyer_id: session.user.id,
        listing_id: listing.id,
        status: "PENDING",
        shipping_address: shippingAddress || {},
        unit_price: listing.price,
        // Stash all the shipping/promo on the first row so we don't
        // double-count it across rows when computing totals later.
        shipping_price: i === 0 ? shippingCents - promoDiscountCents : 0,
        quantity: 1,
        stripe_session_id: checkoutSession.id,
      })
    }

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
