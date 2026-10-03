import type Stripe from "stripe"
import { stripe } from "@/lib/stripe"
import { supabaseAdmin } from "@/lib/supabase"
import { sendCheckoutReminderEmail, type ReminderItem, type ReminderLocale } from "@/lib/email"

const BASE_URL = "https://batsclub.com"
const WEEK_SECONDS = 7 * 24 * 60 * 60

function parseImages(raw: unknown): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.filter((u): u is string => typeof u === "string")
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw)
      return Array.isArray(p) ? p.filter((u): u is string => typeof u === "string") : [raw]
    } catch {
      return [raw]
    }
  }
  return []
}

function one<T>(v: T | T[] | null | undefined): T | null {
  return Array.isArray(v) ? v[0] ?? null : v ?? null
}

function parseJson<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

/**
 * Sends one reminder email for an expired, unpaid Checkout Session.
 *
 * Only for logged-in buyers (we have their account email). Stripe doesn't
 * hand out guest emails on expired sessions for this (HK) account, since
 * promotional-consent collection is US-only. Skips when:
 *  - the session has no recovery link (created before recovery was enabled)
 *  - the buyer already got a reminder in the past 7 days
 *  - nothing from the cart is still for sale
 * Resend's idempotency key keeps webhook retries from double-sending.
 */
export async function sendCheckoutReminder(session: Stripe.Checkout.Session): Promise<string> {
  const meta = session.metadata || {}
  const recoveryUrl = session.after_expiration?.recovery?.url
  const buyerId = meta.buyer_id
  if (!recoveryUrl) return "skip: no recovery url"
  if (!buyerId) return "skip: guest checkout"

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("email, name")
    .eq("id", buyerId)
    .maybeSingle()
  if (!user?.email) return "skip: buyer has no email"

  // At most one reminder per buyer per week: every earlier expired session of
  // theirs with a recovery link in that window already produced one.
  const since = session.created - WEEK_SECONDS
  const recent = await stripe.checkout.sessions.list({ created: { gte: since }, limit: 100 })
  const remindedRecently = recent.data.some(
    (s) =>
      s.id !== session.id &&
      s.created < session.created &&
      s.status === "expired" &&
      s.metadata?.buyer_id === buyerId &&
      !!s.after_expiration?.recovery?.enabled,
  )
  if (remindedRecently) return "skip: reminded in the last 7 days"

  const listingIds = parseJson<string[]>(meta.listing_ids, [])
  const quantities = parseJson<number[]>(meta.listing_quantities, [])
  if (listingIds.length === 0) return "skip: no listings in metadata"

  const { data: rows } = await supabaseAdmin
    .from("listings")
    .select("id, price, stock, active, condition, photos, figure:figures(name, imageUrl:image_url, images), art:art(title)")
    .in("id", listingIds)

  const items: ReminderItem[] = []
  let allOneOfAKind = true
  for (let i = 0; i < listingIds.length; i++) {
    const row = (rows || []).find((r: any) => r.id === listingIds[i]) as any
    const quantity = Math.max(1, Math.floor(Number(quantities[i] ?? 1)))
    if (!row || !row.active || (row.stock ?? 0) < quantity) continue
    const figure = one<any>(row.figure)
    const art = one<any>(row.art)
    if ((row.stock ?? 0) > 1) allOneOfAKind = false
    items.push({
      name: figure?.name || art?.title || "Your item",
      imageUrl: parseImages(row.photos)[0] || parseImages(figure?.images)[0] || figure?.imageUrl || null,
      priceCents: row.price,
      quantity,
      condition: figure ? row.condition ?? null : null,
      href: `${BASE_URL}${art ? "/art" : "/shop"}/${row.id}`,
    })
  }
  if (items.length === 0) return "skip: nothing left for sale"

  const partlySold = items.length < listingIds.length
  const locale: ReminderLocale = meta.locale === "ru" || meta.locale === "jp" ? meta.locale : "en"
  const country = parseJson<{ country?: string }>(meta.shipping_address, {}).country || null
  let countryName: string | null = null
  if (country) {
    try {
      countryName = new Intl.DisplayNames([locale === "jp" ? "ja" : locale], { type: "region" }).of(country) || country
    } catch {
      countryName = country
    }
  }

  await sendCheckoutReminderEmail({
    email: user.email,
    firstName: (user.name || "").trim().split(/\s+/)[0] || null,
    locale,
    items,
    partlySold,
    // The recovery link rebuilds the whole original cart, so only use it when
    // everything is still available; otherwise send them to the item page.
    ctaUrl: partlySold ? items[0].href : recoveryUrl,
    countryName,
    shippingCents: Number(meta.shipping_cents || "0"),
    discountCents: Number(meta.promo_discount_cents || "0"),
    allOneOfAKind,
    idempotencyKey: `checkout-reminder/${session.id}`,
  })
  return `sent: ${items.length} item(s), locale=${locale}, partlySold=${partlySold}`
}
