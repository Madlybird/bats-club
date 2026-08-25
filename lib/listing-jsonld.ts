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
      // Rates here must mirror the <g:shipping> blocks in app/feed.xml/route.ts
      // (Merchant Center feed) — Google cross-checks the two and flags mismatches.
      shippingDetails: SHIPPING_COUNTRIES.map(({ country, price }) => ({
        "@type": "OfferShippingDetails",
        shippingRate: { "@type": "MonetaryAmount", value: price, currency: "USD" },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: country },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 3, unitCode: "DAY" },
          transitTime: { "@type": "QuantitativeValue", minValue: 5, maxValue: 21, unitCode: "DAY" },
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

// Flat shipping rates — the single source of truth referenced by both the
// JSON-LD above and app/feed.xml/route.ts's <g:shipping> blocks.
export const SHIPPING_COUNTRIES = [
  { country: "US", price: 12 },
  { country: "JP", price: 17 },
  { country: "GB", price: 12 },
  { country: "RU", price: 9 },
]
