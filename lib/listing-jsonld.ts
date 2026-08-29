const BASE = "https://batsclub.com"

interface FigureForJsonLd {
  id: string
  slug?: string | null
  name: string
  series: string
  manufacturer?: string | null
  imageUrl?: string | null
}

interface ListingForJsonLd {
  id: string
  price: number
  stock?: number | null
  condition: string
  description?: string | null
}

// Price/currency here MUST match what the page renders next to it
// (`$${(listing.price / 100).toFixed(2)}`, always USD regardless of
// locale — the jp/ru pages only show a secondary "approx" conversion).
export function buildListingJsonLd(
  listing: ListingForJsonLd,
  figure: FigureForJsonLd,
  displayImages: string[],
  localePrefix: string
) {
  const path = localePrefix ? `/${localePrefix}/shop/${listing.id}` : `/shop/${listing.id}`
  const inStock = (listing.stock ?? 1) > 0

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: figure.name,
    sku: listing.id,
    productID: listing.id,
    description: listing.description?.trim() || `${figure.name} — ${figure.series}. Condition: ${listing.condition}.`,
    image: displayImages.length > 0 ? displayImages : figure.imageUrl ? [figure.imageUrl] : [],
    brand: { "@type": "Brand", name: figure.manufacturer || "Unknown" },
    // No per-figure colour data exists in the DB, and painted PVC/resin
    // figures are rarely a single colour anyway — "Multicolor" is
    // Google's own accepted catch-all value for this attribute rather
    // than leaving it unset (Merchant Center flags missing colour on
    // every figure otherwise, even though it's a non-blocking hint).
    color: "Multicolor",
    offers: {
      "@type": "Offer",
      url: `${BASE}${path}`,
      price: Number((listing.price / 100).toFixed(2)),
      priceCurrency: "USD",
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/UsedCondition",
      seller: { "@type": "Organization", name: "Bats Club" },
      // Rates + delivery time here must mirror the Merchant Center delivery
      // policies (and the <g:shipping> blocks in app/feed.xml/route.ts) —
      // Google cross-checks feed vs account and flags mismatches. MC policies:
      // handling 1–3 + transit 7–12 = 8–15 working days for every region.
      shippingDetails: SHIPPING_COUNTRIES.map(({ country, price }) => ({
        "@type": "OfferShippingDetails",
        shippingRate: { "@type": "MonetaryAmount", value: price, currency: "USD" },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: country },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 3, unitCode: "DAY" },
          transitTime: { "@type": "QuantitativeValue", minValue: 7, maxValue: 12, unitCode: "DAY" },
        },
      })),
      // Mirrors app/returns/page.tsx: 14-day window, transit-damage only,
      // Bats Club covers return shipping on approved returns.
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 14,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
        applicableCountry: SHIPPING_COUNTRIES.map((c) => c.country),
      },
    },
  }
}

// Per-country shipping rates (first item, USD) — the single source of truth
// referenced by both the JSON-LD above and app/feed.xml/route.ts's
// <g:shipping> blocks. These MUST mirror the five delivery policies in
// Merchant Center (USA / Europe / Asia / Rest of World / Russia) exactly —
// Google cross-checks the feed against account settings and flags mismatches.
export const SHIPPING_COUNTRIES = [
  // USA policy + Europe policy — $12
  { country: "US", price: 12 },
  { country: "CA", price: 12 },
  { country: "GB", price: 12 },
  { country: "AT", price: 12 },
  { country: "BE", price: 12 },
  { country: "CH", price: 12 },
  { country: "DE", price: 12 },
  { country: "DK", price: 12 },
  { country: "ES", price: 12 },
  { country: "FI", price: 12 },
  { country: "FR", price: 12 },
  { country: "GR", price: 12 },
  { country: "HU", price: 12 },
  { country: "IE", price: 12 },
  { country: "IT", price: 12 },
  { country: "NL", price: 12 },
  { country: "NO", price: 12 },
  { country: "PL", price: 12 },
  { country: "PT", price: 12 },
  { country: "RO", price: 12 },
  { country: "SE", price: 12 },
  { country: "SK", price: 12 },
  // Asia policy — $17
  { country: "JP", price: 17 },
  // Rest of World policy — $15
  { country: "AU", price: 15 },
  { country: "CL", price: 15 },
  { country: "MX", price: 15 },
  { country: "MA", price: 15 },
  { country: "NZ", price: 15 },
  // Russia policy — $9
  { country: "RU", price: 9 },
  { country: "BY", price: 9 },
]
