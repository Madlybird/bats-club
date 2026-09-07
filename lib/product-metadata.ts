import type { Metadata } from "next"

const BASE = "https://batsclub.com"

export type Locale = "" | "ru" | "jp"

type ProductMeta = Pick<Metadata, "alternates" | "openGraph">

function localeUrl(locale: Locale, pathAfterLocale: string): string {
  return `${BASE}${locale ? `/${locale}` : ""}${pathAfterLocale}`
}

function block(canonical: string, pathAfterLocale: string, title: string, image: string | null): ProductMeta {
  return {
    alternates: {
      canonical,
      languages: {
        en: localeUrl("", pathAfterLocale),
        ru: localeUrl("ru", pathAfterLocale),
        ja: localeUrl("jp", pathAfterLocale),
        "x-default": localeUrl("", pathAfterLocale),
      },
    },
    // Explicit og:image + og:url so image crawlers (Google Images / Lens)
    // bind the product photo to *this* URL instead of guessing among the
    // several pages that carry the same Supabase image.
    openGraph: {
      title,
      url: canonical,
      type: "website",
      images: image ? [{ url: image }] : [],
    },
  }
}

/**
 * `alternates` + `openGraph` for a /shop/<id> product page in `locale`.
 * Self-canonical, hreflang across the three locale variants.
 */
export function shopListingMetadata(
  id: string,
  locale: Locale,
  title: string,
  image: string | null
): ProductMeta {
  const path = `/shop/${id}`
  return block(localeUrl(locale, path), path, title, image)
}

/**
 * `alternates` + `openGraph` for an /art/<id> listing page in `locale`.
 * Self-canonical, hreflang across the three locale variants — mirrors
 * shopListingMetadata but for the art section.
 */
export function artListingMetadata(
  id: string,
  locale: Locale,
  title: string,
  image: string | null
): ProductMeta {
  const path = `/art/${id}`
  return block(localeUrl(locale, path), path, title, image)
}

/**
 * `alternates` + `openGraph` for a /figures/<slug> archive page in `locale`.
 *
 * When `activeListingId` is set (the figure has a live listing) canonical and
 * hreflang point at the /shop/<id> page instead: the archive page and the shop
 * listing are the same item with the same photos and the same Product JSON-LD,
 * and letting Google choose between them is what sends Google Images / Lens
 * clicks to the wrong page. Archive-only figures (sold / never listed) stay
 * self-canonical.
 */
export function figurePageMetadata(
  slug: string,
  locale: Locale,
  title: string,
  image: string | null,
  activeListingId: string | null
): ProductMeta {
  if (activeListingId) return shopListingMetadata(activeListingId, locale, title, image)
  const path = `/figures/${slug}`
  return block(localeUrl(locale, path), path, title, image)
}
