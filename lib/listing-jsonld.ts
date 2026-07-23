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
    offers: {
      "@type": "Offer",
      url: `${BASE}${path}`,
      price: Number((listing.price / 100).toFixed(2)),
      priceCurrency: "USD",
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/UsedCondition",
      seller: { "@type": "Organization", name: "Bats Club" },
    },
  }
}
