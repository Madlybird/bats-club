import { NextResponse } from "next/server"
import Stripe from "stripe"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { stripe } from "@/lib/stripe"
import { checkRateLimit } from "@/lib/rate-limit"
import {
  getShippingInfo,
  getArtShippingInfo,
  artCategoryMax,
  ALLOWED_COUNTRIES,
  MAX_ORDER_QUANTITY,
} from "@/lib/shipping"
import {
  SHIPPING_PROMO,
  isValidPromoCode,
  normalizePromoCode,
  promoDiscountCents as computePromoDiscount,
} from "@/lib/promo"

// Loose abuse cap on distinct cart lines (real per-kind caps applied after the
// listings are fetched: max 3 figures, per-type max on art).
const MAX_CART_LINES = 60

function localeFromReferer(referer: string | null): "en" | "ru" | "jp" {
  try {
    const path = referer ? new URL(referer).pathname : ""
    if (path.startsWith("/ru/") || path === "/ru") return "ru"
    if (path.startsWith("/jp/") || path === "/jp") return "jp"
  } catch {}
  return "en"
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
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) {
    return NextResponse.json(
      { error: "STRIPE_SECRET_KEY is not configured on the server" },
      { status: 500 }
    )
  }

  // Each call spins up a Stripe Checkout Session — nothing moves money or
  // stock until payment, but throttle session spam for defence-in-depth
  // (consistent with the other token/lookup endpoints).
  const limited = checkRateLimit(req, "checkout", 30, 5 * 60 * 1000)
  if (limited) return limited

  // Guest checkout is allowed — Stripe collects a verified email +
  // shipping address on its own hosted page, so a site account isn't
  // required to buy. If the buyer is logged in, we still tag the
  // order with their user id; otherwise the webhook resolves (or
  // creates) a buyer record from the email Stripe collects.
  const session = await getServerSession(authOptions)

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
      buyer: session?.user?.id ?? "guest",
    })

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 })
    }
    if (items.length > MAX_CART_LINES) {
      return NextResponse.json({ error: "Too many items in the cart" }, { status: 400 })
    }
    // `country` is required only when something physical ships — checked after
    // the listings are fetched (a digital-only cart needs no address).

    stage = "fetch-listings"
    const listingIds = items.map((i) => i.listingId)
    const { data: listingsData, error: listingsError } = await supabaseAdmin
      .from("listings")
      .select(
        "id, price, condition, stock, photos, " +
          "figure:figures(name, series, scale, imageUrl:image_url), " +
          "art:art(title, series, type, size, is_digital, file_path, file_name)"
      )
      .in("id", listingIds)
      .eq("active", true)

    if (listingsError) {
      console.error("[checkout] supabase listings error:", listingsError)
      throw listingsError
    }
    // Supabase's type-level select parser can't resolve the multi-relation
    // embed here, so `listingsData` degrades to GenericStringError at the
    // type level — cast to the real row shape we know it returns.
    const listings = (listingsData as any[]) || []
    console.log(`[checkout] fetched ${listings?.length ?? 0}/${listingIds.length} listings`)
    if (!listings || listings.length !== listingIds.length) {
      return NextResponse.json({ error: "One or more items are no longer available" }, { status: 400 })
    }
    // A listing describes either a figure or an art piece (never both).
    // Normalise both into one shape for the name / description / image the
    // Stripe line item and the error messages need.
    const itemInfo = (listing: any): { name: string; description: string; image: string | null } => {
      const figure = listing.figure as any
      if (figure) {
        return {
          name: figure.name,
          description: `${figure.series} · ${figure.scale} · ${listing.condition}`,
          image: figure.imageUrl ?? null,
        }
      }
      const art = listing.art as any
      let photo: string | null = null
      const raw = listing.photos
      const arr = Array.isArray(raw) ? raw : typeof raw === "string" ? (() => { try { return JSON.parse(raw) } catch { return [] } })() : []
      if (Array.isArray(arr) && typeof arr[0] === "string") photo = arr[0]
      return {
        name: art?.title ?? "Item",
        description: [art?.series, art?.type, art?.size].filter(Boolean).join(" · "),
        image: photo,
      }
    }

    const isDigital = (l: any) => !!l.art?.is_digital

    // Map requested quantity by listingId — coerce to a positive integer,
    // fall back to 1. Digital downloads are always quantity 1.
    const requestedQty = new Map<string, number>()
    for (const i of items) {
      const n = Math.floor(Number(i.quantity ?? 1))
      requestedQty.set(i.listingId, Number.isFinite(n) && n >= 1 ? n : 1)
    }
    for (const listing of listings) {
      if (isDigital(listing)) {
        requestedQty.set(listing.id, 1)
        continue // unlimited copies, no stock to check
      }
      const name = itemInfo(listing).name
      if (listing.stock < 1) {
        return NextResponse.json({ error: `${name} is out of stock` }, { status: 400 })
      }
      const qty = requestedQty.get(listing.id) ?? 1
      if (qty > listing.stock) {
        return NextResponse.json(
          { error: `Only ${listing.stock} of ${name} available` },
          { status: 400 }
        )
      }
    }

    // A listing points at exactly one of figure / art. They ship differently:
    // figures on the tiered per-order table (max 3), physical art as one
    // weight-priced ePacket parcel with a per-type quantity cap, digital art
    // not at all. A mixed cart pays for whatever physically ships.
    const figureListings = listings.filter((l) => l.figure)
    const artListings = listings.filter((l) => l.art)
    const hasPhysical =
      figureListings.length > 0 || artListings.some((l) => !isDigital(l))

    if (hasPhysical) {
      if (!country) {
        return NextResponse.json({ error: "Country is required" }, { status: 400 })
      }
      if (!ALLOWED_COUNTRIES.has(country)) {
        return NextResponse.json({ error: "We don't ship to this country." }, { status: 400 })
      }
    }

    if (figureListings.length > MAX_ORDER_QUANTITY) {
      return NextResponse.json(
        { error: `Maximum ${MAX_ORDER_QUANTITY} figures per order` },
        { status: 400 }
      )
    }
    for (const listing of artListings) {
      if (isDigital(listing)) continue
      const type = listing.art?.type ?? ""
      const qty = requestedQty.get(listing.id) ?? 1
      const cap = artCategoryMax(type)
      if (qty > cap) {
        return NextResponse.json(
          { error: `Maximum ${cap} of ${itemInfo(listing).name} per order` },
          { status: 400 }
        )
      }
    }

    const figureShip = figureListings.length > 0
      ? getShippingInfo(country ?? "", figureListings.length)
      : null
    const artShip = artListings.length > 0
      ? getArtShippingInfo(
          country ?? "",
          artListings.map((l) => ({
            type: l.art?.type ?? "",
            quantity: requestedQty.get(l.id) ?? 1,
            isDigital: isDigital(l),
          }))
        )
      : null
    if (figureShip?.blocked) {
      return NextResponse.json({ error: figureShip.blockedMessage }, { status: 400 })
    }
    if (artShip?.blocked) {
      return NextResponse.json({ error: artShip.blockedMessage }, { status: 400 })
    }
    const shippingCents = (figureShip?.priceCents ?? 0) + (artShip?.priceCents ?? 0)

    const itemsSubtotal = listings.reduce(
      (sum, l) => sum + l.price * (requestedQty.get(l.id) ?? 1),
      0
    )

    // In-app promo (lib/promo.ts): recomputed here from the server-side
    // shipping quote — the client only sends the code. An unknown or
    // expired code is rejected rather than silently dropped, so a cart
    // that was open past the deadline doesn't quietly charge more.
    if (promoCode && !isValidPromoCode(promoCode)) {
      return NextResponse.json({ error: "This promo code has expired or is invalid" }, { status: 400 })
    }
    const promoDiscountCents = computePromoDiscount(promoCode, shippingCents)

    // Always use the canonical production domain for Stripe redirect
    // URLs. Preview deployment URLs (e.g. bats-club-xxx.vercel.app)
    // aren't stable and cause errors when Stripe redirects back.
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://batsclub.com"

    // Figures are 1-of-1; physical art carries the requested quantity; digital
    // downloads are always 1 (forced above).
    const qtyOf = (listing: any) => (listing.art ? (requestedQty.get(listing.id) ?? 1) : 1)
    const stripeLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = listings.map((listing) => {
      const info = itemInfo(listing)
      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: info.name,
            description: info.description || undefined,
            images: info.image ? [info.image] : [],
          },
          unit_amount: listing.price,
        },
        quantity: qtyOf(listing),
      }
    })

    if (shippingCents > 0) {
      const totalUnits = listings.reduce((n, l) => n + qtyOf(l), 0)
      stripeLineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: `Shipping to ${country} (${totalUnits} ${totalUnits === 1 ? "item" : "items"})`,
          },
          unit_amount: shippingCents,
        },
        quantity: 1,
      })
    }

    // Build Checkout Session params. A digital-only order collects no shipping
    // address; a physical (or mixed) order locks the address country to the
    // one the shipping quote was computed for.
    const params: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: stripeLineItems,
      mode: "payment",
      success_url: `${baseUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cart`,
      customer_email: session?.user?.email || undefined,
      // Abandoned checkout: the session expires after an hour (Stripe's
      // default is 24h) and the webhook's checkout.session.expired handler
      // emails logged-in buyers a link back to the item page
      // (lib/checkout-reminder.ts). Stripe's after_expiration.recovery is
      // deliberately NOT used: its link stays payable for 30 days without
      // re-checking stock, so a 1-of-1 figure sold meanwhile could be paid
      // for twice.
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
    }
    if (hasPhysical) {
      params.shipping_address_collection = {
        allowed_countries: [country] as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[],
      }
      params.phone_number_collection = { enabled: true }
    }

    if (promoDiscountCents > 0) {
      stage = "create-coupon"
      // In-app coupon path (mutually exclusive with allow_promotion_codes)
      const coupon = await stripe.coupons.create({
        amount_off: promoDiscountCents,
        currency: "usd",
        duration: "once",
        name: `Promo: ${normalizePromoCode(promoCode)} (${SHIPPING_PROMO.shippingPercentOff}% off shipping)`,
      })
      params.discounts = [{ coupon: coupon.id }]
    } else {
      params.allow_promotion_codes = true
    }

    // Pack everything the webhook needs into Stripe metadata so we
    // can create order rows AFTER payment is confirmed — not before.
    params.metadata = {
      // Empty string, not omitted, so the webhook can reliably tell
      // "no session" apart from a missing key when it parses metadata.
      buyer_id: session?.user?.id || "",
      listing_ids: JSON.stringify(listings.map((l) => l.id)),
      listing_prices: JSON.stringify(listings.map((l) => l.price)),
      listing_quantities: JSON.stringify(listings.map((l) => qtyOf(l))),
      listing_is_digital: JSON.stringify(listings.map((l) => isDigital(l))),
      shipping_cents: String(shippingCents),
      promo_discount_cents: String(promoDiscountCents),
      shipping_address: JSON.stringify(shippingAddress || {}),
      // Site locale the buyer checked out from, for the reminder email.
      locale: localeFromReferer(req.headers.get("referer")),
      // "1" = an abandoned-checkout reminder may be sent for this session
      // (logged-in buyer); also how the reminder's 7-day cap finds earlier ones.
      reminder: session?.user?.id ? "1" : "",
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

    // Only forward genuinely user-facing card errors (e.g. "Your card
    // was declined"). Everything else — DB errors, config issues, raw
    // exception messages — is logged above and returns a generic error
    // so we don't leak internals to the browser.
    const isCardError = error instanceof Stripe.errors.StripeError && error.type === "StripeCardError"

    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        stage,
        ...(isCardError && {
          message: error.message,
          stripe: { code: (error as any).code, decline_code: (error as any).decline_code },
        }),
      },
      { status: 500 }
    )
  }
}
