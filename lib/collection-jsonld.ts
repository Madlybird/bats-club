// CollectionPage for browsable catalog pages (archive, shop). Deliberately
// does NOT enumerate every item as itemListElement — with 480+ figures /
// 380+ listings that would be a huge, mostly-pointless payload, and Google's
// own guidance treats ItemList as meant for curated/ranked lists (top-10s,
// recipe steps), not full paginated catalogs. `numberOfItems` alone is
// enough to describe the collection without the risk of an oversized or
// stale itemListElement array drifting out of sync with the real catalog.
export function buildCollectionPageJsonLd(opts: {
  name: string
  description: string
  url: string
  numberOfItems: number
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: opts.name,
    description: opts.description,
    url: opts.url,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: opts.numberOfItems,
    },
  }
}
