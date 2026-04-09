/** Exchange rate helpers — server-side only (used in async page components) */

export interface Rates {
  RUB: number
  JPY: number
}

const FALLBACK: Rates = { RUB: 92, JPY: 149 }

/**
 * Fetch live USD rates with 1-hour Next.js cache.
 * Falls back to hardcoded estimates if the API is unavailable.
 */
export async function getRates(): Promise<Rates> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return FALLBACK
    const data = await res.json()
    const RUB = typeof data?.rates?.RUB === "number" ? data.rates.RUB : FALLBACK.RUB
    const JPY = typeof data?.rates?.JPY === "number" ? data.rates.JPY : FALLBACK.JPY
    return { RUB, JPY }
  } catch {
    return FALLBACK
  }
}

/**
 * Convert a USD amount (in cents) to the locale currency string.
 * Returns null for EN (no conversion needed).
 */
export function convertPrice(
  cents: number,
  locale: "en" | "ru" | "jp",
  rates: Rates
): string | null {
  const usd = cents / 100
  if (locale === "ru") return `₽\u202F${Math.round(usd * rates.RUB).toLocaleString("ru-RU")}`
  if (locale === "jp") return `¥${Math.round(usd * rates.JPY).toLocaleString("ja-JP")}`
  return null
}
