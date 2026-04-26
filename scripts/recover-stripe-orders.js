// Recover orders that were paid in Stripe but never landed in the
// `orders` table (typically because the webhook wasn't firing).
//
// Walks recent Stripe Checkout Sessions, and for any paid session
// that doesn't already have a row in `orders`, runs the same
// insert-and-deactivate logic the webhook does.
//
// Run: node scripts/recover-stripe-orders.js
// Optional: SINCE_HOURS=72 node scripts/recover-stripe-orders.js
//           LISTING_ID=f60794de-09a7-4330-a67d-af15cb2b0ba7 node scripts/recover-stripe-orders.js

const fs = require("fs")
const path = require("path")
const { createClient } = require("@supabase/supabase-js")
const Stripe = require("stripe")

const env = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8")
const read = (k) => {
  const m = env.match(new RegExp("^" + k + "=(.*)$", "m"))
  if (!m) return null
  return m[1].trim().replace(/^"(.*)"$/, "$1")
}

const supabaseUrl = read("NEXT_PUBLIC_SUPABASE_URL")
const supabaseSecret = read("SUPABASE_SECRET_KEY")
const stripeSecret = read("STRIPE_SECRET_KEY")

if (!supabaseUrl || !supabaseSecret || !stripeSecret) {
  console.error("Missing one of: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, STRIPE_SECRET_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseSecret, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const stripe = new Stripe(stripeSecret, { apiVersion: "2024-04-10" })

const sinceHours = Number(process.env.SINCE_HOURS || "168") // default 7 days
const onlyListingId = process.env.LISTING_ID || null
const sinceTs = Math.floor(Date.now() / 1000) - sinceHours * 3600

function extractShippingAddress(session) {
  const direct = session.shipping_details
  const collected = session.collected_information && session.collected_information.shipping_details
  const fallback = session.customer_details
  const source = direct || collected || null
  if (source && source.address) {
    return {
      name: source.name || (fallback && fallback.name) || null,
      phone: source.phone || (fallback && fallback.phone) || null,
      ...source.address,
    }
  }
  if (fallback && fallback.address) {
    return {
      name: fallback.name || null,
      phone: fallback.phone || null,
      ...fallback.address,
    }
  }
  return null
}

async function decrementStock(listingId, quantity) {
  const { data: listing, error } = await supabase
    .from("listings")
    .select("stock")
    .eq("id", listingId)
    .single()
  if (error || !listing) {
    console.error(`  ! listing ${listingId} not found:`, error && error.message)
    return
  }
  const newStock = Math.max(0, listing.stock - quantity)
  const update = { stock: newStock }
  if (newStock <= 0) update.active = false
  const { error: updErr } = await supabase.from("listings").update(update).eq("id", listingId)
  if (updErr) console.error(`  ! listing ${listingId} update failed:`, updErr.message)
  else console.log(`  ✓ listing ${listingId} stock=${newStock}${newStock <= 0 ? " active=false" : ""}`)
}

async function recoverSession(session) {
  const meta = session.metadata || {}
  const buyerId = meta.buyer_id
  const listingIds = meta.listing_ids ? JSON.parse(meta.listing_ids) : []
  const listingPrices = meta.listing_prices ? JSON.parse(meta.listing_prices) : []
  const shippingCents = Number(meta.shipping_cents || "0")
  const promoDiscountCents = Number(meta.promo_discount_cents || "0")

  if (!buyerId || listingIds.length === 0) {
    console.log(`  - skipping ${session.id}: no buyer_id/listing_ids in metadata`)
    return false
  }

  if (onlyListingId && !listingIds.includes(onlyListingId)) return false

  const { data: existing } = await supabase
    .from("orders")
    .select("id")
    .eq("stripe_session_id", session.id)
  if (existing && existing.length > 0) {
    console.log(`  - ${session.id} already has ${existing.length} order row(s), skipping`)
    return false
  }

  const shipping = extractShippingAddress(session)
  console.log(`  → recovering ${session.id} for buyer ${buyerId} (${listingIds.length} listing(s))`)

  for (let i = 0; i < listingIds.length; i++) {
    const listingId = listingIds[i]
    const price = listingPrices[i] || 0
    const row = {
      buyer_id: buyerId,
      listing_id: listingId,
      status: "PAID",
      shipping_address: shipping || {},
      unit_price: price,
      shipping_price: i === 0 ? shippingCents - promoDiscountCents : 0,
      quantity: 1,
      stripe_session_id: session.id,
    }
    const { data, error } = await supabase.from("orders").insert(row).select("id").single()
    if (error) {
      console.error(`  ! order insert ${i} failed:`, error.message)
      continue
    }
    console.log(`  ✓ order ${data.id} inserted`)
    await decrementStock(listingId, 1)
  }
  return true
}

async function main() {
  console.log(`Scanning Stripe Checkout Sessions since ${new Date(sinceTs * 1000).toISOString()}`)
  if (onlyListingId) console.log(`Filter: only listing ${onlyListingId}`)

  let recovered = 0
  let scanned = 0
  for await (const session of stripe.checkout.sessions.list({
    created: { gte: sinceTs },
    limit: 100,
    expand: ["data.customer_details"],
  })) {
    scanned++
    if (session.payment_status !== "paid") continue
    if (await recoverSession(session)) recovered++
  }
  console.log(`\nDone. Scanned ${scanned} session(s), recovered ${recovered}.`)
}

main().catch((err) => {
  console.error("FAILED:", err)
  process.exit(1)
})
