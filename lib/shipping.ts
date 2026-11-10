/** Shared shipping logic — used by both CheckoutButton (client) and API route (server) */

const EUROPE = new Set([
  "DE","FR","IT","ES","NL","BE","AT","CH","SE","NO","DK","FI","PL","CZ","PT","GR",
  "HU","RO","BG","HR","SK","SI","EE","LV","LT","LU","IE","GB",
])

// All countries we ship to (everyone else is blocked)
export const ALLOWED_COUNTRIES = new Set([
  ...Array.from(EUROPE),
  "US","CA","MX","BR","AR","CL","CO","PE", // Americas
  "JP",                                     // Asia (limited)
  "AU","NZ",                                // Other
  "RU",                                     // Russia
])

// Orders are capped at 3 figures; rates below cover the full 1–3 range.
export const MAX_ORDER_QUANTITY = 3

// Tiered shipping rates per region [qty1, qty2, qty3] in cents.
const RATES_RU: readonly [number, number, number] = [900, 1400, 2200]
const RATES_EUROPE: readonly [number, number, number] = [1200, 1800, 2600]
const RATES_US_CA: readonly [number, number, number] = [1200, 1800, 2600]
// Asia (JP only) kept at the higher tier — local post rates are pricier.
const RATES_ASIA: readonly [number, number, number] = [1700, 2600, 4200]
const RATES_REST: readonly [number, number, number] = [1500, 2000, 3000]

export interface ShippingInfo {
  blocked: boolean
  priceCents: number
  priceDisplay: string
  blockedMessage: string
  /** Paper shipments only: how many ePacket parcels the order splits into. */
  parcels?: number
}

function tierFor(countryCode: string): readonly [number, number, number] | null {
  if (countryCode === "RU") return RATES_RU
  if (EUROPE.has(countryCode)) return RATES_EUROPE
  if (countryCode === "US" || countryCode === "CA") return RATES_US_CA
  if (countryCode === "JP") return RATES_ASIA
  if (ALLOWED_COUNTRIES.has(countryCode)) return RATES_REST
  return null
}

const REGION_BLOCKED_MSG =
  "Unfortunately, we don't ship to this region at this time. Please contact us at support@batsclub.com for alternative options."

export function getShippingInfo(countryCode: string, quantity: number = 1): ShippingInfo {
  if (!countryCode) {
    return { blocked: false, priceCents: 0, priceDisplay: "", blockedMessage: "" }
  }
  if (!ALLOWED_COUNTRIES.has(countryCode)) {
    return { blocked: true, priceCents: 0, priceDisplay: "", blockedMessage: REGION_BLOCKED_MSG }
  }

  const tier = tierFor(countryCode)
  if (!tier) {
    return { blocked: true, priceCents: 0, priceDisplay: "", blockedMessage: REGION_BLOCKED_MSG }
  }

  const qty = Math.max(1, Math.min(MAX_ORDER_QUANTITY, Math.floor(quantity)))
  const priceCents = tier[qty - 1]
  return {
    blocked: false,
    priceCents,
    priceDisplay: `$${(priceCents / 100).toFixed(2)}`,
    blockedMessage: "",
  }
}

// ── Art shipping — ePacket (tracked), priced by total shipment weight ─────────
// Fitted from thailandpost.co.th ePacket rates (Sept 2026): THB ≈ base + slope·g.
// One rolled tube / mailer per order, so the whole art part of a cart ships as a
// single package. Figures ship separately on the tiered table above.

/** Estimated packed weight per art type, grams. Unknown type falls back to 60g. */
export const ART_UNIT_WEIGHT_G: Record<string, number> = {
  Postcard: 15,
  Sticker: 15,
  "Digital Print": 45,
  Poster: 55,
  Zine: 120,
  Canvas: 600,
}
const ART_UNIT_WEIGHT_FALLBACK_G = 60

/** Max quantity of one art type in a single order (stepper cap). */
export const ART_CATEGORY_MAX: Record<string, number> = {
  Postcard: 40,
  Sticker: 40,
  "Digital Print": 30,
  Poster: 25,
  Zine: 12,
  Canvas: 3,
}
export const ART_CATEGORY_MAX_FALLBACK = 20

const ART_PACKAGING_G = 90 // tube / rigid mailer, added once per order
const ART_MAX_WEIGHT_G = 2000 // ePacket ceiling — above this the order must be split
const THB_PER_USD = 35 // review quarterly
const ART_HANDLING_USD = 2 // packaging + handling, once per art shipment

const ART_ZONE_FIT: Record<string, { base: number; slope: number }> = {
  ASIA: { base: 145, slope: 0.39 },
  EUROPE: { base: 220, slope: 0.48 },
  RU: { base: 175, slope: 0.87 },
  US_CA: { base: 220, slope: 1.17 },
  REST: { base: 190, slope: 1.07 },
}

function artZoneFor(countryCode: string): keyof typeof ART_ZONE_FIT | null {
  if (countryCode === "RU") return "RU"
  if (EUROPE.has(countryCode)) return "EUROPE"
  if (countryCode === "US" || countryCode === "CA") return "US_CA"
  if (countryCode === "JP") return "ASIA"
  if (ALLOWED_COUNTRIES.has(countryCode)) return "REST"
  return null
}

export interface ArtCartLine {
  type: string
  quantity: number
  /** Digital downloads have no shipping — excluded from the weight. */
  isDigital?: boolean
  /** Actual unit weight in grams. Set for books (weighed one by one in the
   *  bot); art falls back to the per-type ART_UNIT_WEIGHT_G table. */
  weightG?: number
  /** Books ship in a sturdier mailer (BOOK_PACKAGING_G). */
  isBook?: boolean
}

export function artUnitWeight(type: string): number {
  return ART_UNIT_WEIGHT_G[type] ?? ART_UNIT_WEIGHT_FALLBACK_G
}

export function artCategoryMax(type: string): number {
  return ART_CATEGORY_MAX[type] ?? ART_CATEGORY_MAX_FALLBACK
}

const BOOK_PACKAGING_G = 150 // rigid book mailer / box, per parcel

function lineUnitWeight(l: ArtCartLine): number {
  return l.weightG && l.weightG > 0 ? Math.round(l.weightG) : artUnitWeight(l.type)
}

/** Packaging per parcel: book mailer if any book is in the paper shipment. */
function paperPackaging(lines: ArtCartLine[]): number {
  return lines.some((l) => !l.isDigital && l.isBook) ? BOOK_PACKAGING_G : ART_PACKAGING_G
}

/**
 * Splits the physical paper items (art + books — they travel together) into
 * ePacket parcels of at most ART_MAX_WEIGHT_G each, packaging included
 * (first-fit decreasing). Returns each parcel's packed weight, `[]` when
 * nothing physical ships, or `null` when one item alone is too heavy.
 */
export function packPaperParcels(lines: ArtCartLine[]): number[] | null {
  const units: number[] = []
  for (const l of lines) {
    if (l.isDigital) continue
    const n = Math.max(1, Math.floor(l.quantity))
    const w = lineUnitWeight(l)
    for (let i = 0; i < n; i++) units.push(w)
  }
  if (units.length === 0) return []
  const pack = paperPackaging(lines)
  const capacity = ART_MAX_WEIGHT_G - pack
  units.sort((a, b) => b - a)
  if (units[0] > capacity) return null
  const bins: number[] = []
  for (const w of units) {
    const i = bins.findIndex((b) => b + w <= capacity)
    if (i >= 0) bins[i] += w
    else bins.push(w)
  }
  return bins.map((b) => b + pack)
}

/** Total packed weight (grams) of the physical paper items across all
 *  parcels, packaging included. Digital-download lines contribute nothing. */
export function artShipmentWeight(lines: ArtCartLine[]): number {
  const parcels = packPaperParcels(lines)
  if (parcels === null) {
    return lines.reduce(
      (s, l) => (l.isDigital ? s : s + lineUnitWeight(l) * Math.max(1, Math.floor(l.quantity))),
      0,
    )
  }
  return parcels.reduce((s, g) => s + g, 0)
}

/**
 * Shipping cost for the paper part of a cart (art + books ship together).
 * `lines` is one entry per listing with its quantity. Over 2 kg the shipment
 * is split into several ePacket parcels and their prices are summed. Returns
 * `blocked` when the country isn't served or one item alone exceeds ePacket.
 */
export function getArtShippingInfo(countryCode: string, lines: ArtCartLine[]): ShippingInfo {
  const parcels = packPaperParcels(lines)

  // Nothing physical to ship (empty, or all digital downloads) → no charge,
  // no country needed.
  if (parcels !== null && parcels.length === 0) {
    return { blocked: false, priceCents: 0, priceDisplay: "", blockedMessage: "" }
  }
  if (!countryCode) {
    return { blocked: false, priceCents: 0, priceDisplay: "", blockedMessage: "" }
  }
  const zone = artZoneFor(countryCode)
  if (!zone) {
    return { blocked: true, priceCents: 0, priceDisplay: "", blockedMessage: REGION_BLOCKED_MSG }
  }

  if (parcels === null) {
    return {
      blocked: true,
      priceCents: 0,
      priceDisplay: "",
      blockedMessage:
        "One of the items is too heavy for our standard postal service (over 2 kg). Email support@batsclub.com and we'll quote shipping for it.",
    }
  }

  const { base, slope } = ART_ZONE_FIT[zone]
  const usd = parcels.reduce(
    (sum, grams) => sum + Math.ceil((base + slope * grams) / THB_PER_USD) + ART_HANDLING_USD,
    0,
  )
  const priceCents = usd * 100
  return {
    blocked: false,
    priceCents,
    priceDisplay: `$${usd.toFixed(2)}`,
    blockedMessage: "",
    parcels: parcels.length,
  }
}
