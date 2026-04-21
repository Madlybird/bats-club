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
const RATES_EUROPE: readonly [number, number, number] = [1700, 2600, 4200]
const RATES_US_CA: readonly [number, number, number] = [2000, 3000, 5000]
// Asia-tier regions share Europe's pricing (JP).
const RATES_ASIA: readonly [number, number, number] = [1700, 2600, 4200]
const RATES_REST: readonly [number, number, number] = [2200, 3300, 5500]

export interface ShippingInfo {
  blocked: boolean
  priceCents: number
  priceDisplay: string
  blockedMessage: string
}

function tierFor(countryCode: string): readonly [number, number, number] | null {
  if (countryCode === "RU") return RATES_RU
  if (EUROPE.has(countryCode)) return RATES_EUROPE
  if (countryCode === "US" || countryCode === "CA") return RATES_US_CA
  if (countryCode === "JP") return RATES_ASIA
  if (ALLOWED_COUNTRIES.has(countryCode)) return RATES_REST
  return null
}

export function getShippingInfo(countryCode: string, quantity: number = 1): ShippingInfo {
  const BLOCKED_MSG =
    "Unfortunately, we don't ship to this region at this time. Please contact us at support@batsclub.com for alternative options."

  if (!countryCode) {
    return { blocked: false, priceCents: 0, priceDisplay: "", blockedMessage: "" }
  }
  if (!ALLOWED_COUNTRIES.has(countryCode)) {
    return { blocked: true, priceCents: 0, priceDisplay: "", blockedMessage: BLOCKED_MSG }
  }

  const tier = tierFor(countryCode)
  if (!tier) {
    return { blocked: true, priceCents: 0, priceDisplay: "", blockedMessage: BLOCKED_MSG }
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
