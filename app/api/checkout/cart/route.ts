import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { stripe } from "@/lib/stripe"
import { getShippingInfo } from "@/lib/shipping"

const PROMO_CODES: Record<string, number> = {
  BATSCLUB10: 10, // 10% off total
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { items, country, promoCode, shippingAddress } = await req.json()

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

    const listingIds = items.map((i: { listingId: string }) => i.listingId)

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

    // Shipping with optional multi-item discount
    const multiItemDiscount = listings.length >= 2
    let shippingCents = shippingInfo.priceCents
    if (multiItemDiscount) {
      shippingCents = Math.round(shippingCents * 0.85)
    }

    const itemsSubtotal = listings.reduce((sum, l) => sum + l.price, 0)

    // Promo code validation
    let promoDiscountCents = 0
    let promoRate = 0
    if (promoCode) {
      const code = String(promoCode).toUpperCase().trim()
      promoRate = PROMO_CODES[code] ?? 0
      if (promoRate > 0) {
        promoDiscountCents = Math.round((itemsSubtotal + shippingCents) * (promoRate / 100))
      }
    }

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

    const stripeLineItems = listings.map((listing) => {
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
        product_data: { name: shippingLabel, description: "", images: [] },
        unit_amount: shippingCents,
      },
      quantity: 1,
    })

    const discounts: { coupon: string }[] = []
    if (promoDiscountCents > 0) {
      const coupon = await stripe.coupons.create({
        amount_off: promoDiscountCents,
        currency: "usd",
        duration: "once",
        name: `Promo: ${String(promoCode).toUpperCase().trim()} (${promoRate}% off)`,
      })
      discounts.push({ coupon: coupon.id })
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: stripeLineItems,
      ...(discounts.length > 0 ? { discounts } : {}),
      mode: "payment",
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cart`,
      customer_email: session.user.email || undefined,
    })

    // Create one Order per listing
    for (let i = 0; i < listings.length; i++) {
      const listing = listings[i]
      await supabaseAdmin.from("orders").insert({
        buyer_id: session.user.id,
        listing_id: listing.id,
        status: "PENDING",
        shipping_address: shippingAddress || {},
        unit_price: listing.price,
        shipping_price: i === 0 ? shippingCents - promoDiscountCents : 0,
        quantity: 1,
        stripe_session_id: checkoutSession.id,
      })
    }

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error("Cart checkout error:", error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
