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
  "AU","NZ","IL","AE","SA","TR",            // Other
  "RU",                                     // Russia
])

export interface ShippingInfo {
  blocked: boolean
  priceCents: number
  priceDisplay: string
  blockedMessage: string
}

export function getShippingInfo(countryCode: string): ShippingInfo {
  const BLOCKED_MSG =
    "Unfortunately, we don't ship to this region at this time. Please contact us at support@batsclub.com for alternative options."

  if (!countryCode) {
    return { blocked: false, priceCents: 0, priceDisplay: "", blockedMessage: "" }
  }
  if (!ALLOWED_COUNTRIES.has(countryCode)) {
    return { blocked: true, priceCents: 0, priceDisplay: "", blockedMessage: BLOCKED_MSG }
  }
  if (countryCode === "RU") {
    return { blocked: false, priceCents: 900, priceDisplay: "$9.00", blockedMessage: "" }
  }
  if (EUROPE.has(countryCode)) {
    return { blocked: false, priceCents: 1700, priceDisplay: "$17.00", blockedMessage: "" }
  }
  if (countryCode === "US" || countryCode === "CA") {
    return { blocked: false, priceCents: 2000, priceDisplay: "$20.00", blockedMessage: "" }
  }
  if (countryCode === "IL" || countryCode === "AE" || countryCode === "SA" || countryCode === "TR" || countryCode === "JP") {
    return { blocked: false, priceCents: 1700, priceDisplay: "$17.00", blockedMessage: "" }
  }
  // Americas (MX, BR, AR, CL, CO, PE) + AU + NZ
  return { blocked: false, priceCents: 2200, priceDisplay: "$22.00", blockedMessage: "" }
}
