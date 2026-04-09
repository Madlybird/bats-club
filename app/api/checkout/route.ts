import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { stripe } from "@/lib/stripe"
import { getShippingInfo } from "@/lib/shipping"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { listingId, shippingAddress } = await req.json()

    if (!listingId) {
      return NextResponse.json({ error: "Listing ID required" }, { status: 400 })
    }

    const country = (shippingAddress as Record<string, string>)?.country || ""
    const shippingInfo = getShippingInfo(country)

    if (shippingInfo.blocked) {
      return NextResponse.json({ error: shippingInfo.blockedMessage }, { status: 400 })
    }

    if (!country) {
      return NextResponse.json({ error: "Country is required" }, { status: 400 })
    }

    const { data: listing, error: listingError } = await supabaseAdmin
      .from("listings")
      .select("id, price, condition, stock, figure:figures(name, series, scale, imageUrl:image_url)")
      .eq("id", listingId)
      .eq("active", true)
      .single()

    if (listingError || !listing) {
      return NextResponse.json({ error: "Listing not found or unavailable" }, { status: 404 })
    }

    if (listing.stock < 1) {
      return NextResponse.json({ error: "Out of stock" }, { status: 400 })
    }

    const figure = listing.figure as any
    const shippingCents = shippingInfo.priceCents
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

    // Create pending order
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        buyer_id: session.user.id,
        listing_id: listingId,
        status: "PENDING",
        shipping_address: shippingAddress || {},
        unit_price: listing.price,
        shipping_price: shippingCents,
        quantity: 1,
      })
      .select("id")
      .single()

    if (orderError || !order) throw orderError

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
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
        },
        {
          price_data: {
            currency: "usd",
            product_data: { name: `Shipping to ${country}` },
            unit_amount: shippingCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel`,
      metadata: { orderId: order.id },
      customer_email: session.user.email || undefined,
    })

    // Store Stripe session ID on order
    await supabaseAdmin
      .from("orders")
      .update({ stripe_session_id: checkoutSession.id })
      .eq("id", order.id)

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
