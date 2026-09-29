// Single source of truth for the current site promo. Read by the checkout
// API (authoritative — it recomputes the discount server-side), the cart
// (display + one-click apply), the promo modal and the announcement bar.
// Everything switches itself off at `endsAt`; nothing needs to be
// reverted by hand when the promo is over.

export interface ShippingPromo {
  code: string
  shippingPercentOff: number
  endsAt: number // epoch ms, UTC
}

// 50% off shipping, through the end of 5 Oct 2026 UTC.
export const SHIPPING_PROMO: ShippingPromo = {
  code: "SHIP50",
  shippingPercentOff: 50,
  endsAt: Date.UTC(2026, 9, 5, 23, 59, 59, 999),
}

export function isPromoActive(now: number = Date.now()): boolean {
  return now <= SHIPPING_PROMO.endsAt
}

export function normalizePromoCode(code: string | undefined | null): string {
  return String(code ?? "").trim().toUpperCase()
}

/** True if `code` is the current promo and it hasn't expired. */
export function isValidPromoCode(code: string | undefined | null, now: number = Date.now()): boolean {
  return isPromoActive(now) && normalizePromoCode(code) === SHIPPING_PROMO.code
}

/** Discount in cents for a valid code — applies to shipping only. */
export function promoDiscountCents(code: string | undefined | null, shippingCents: number, now: number = Date.now()): number {
  if (!isValidPromoCode(code, now) || shippingCents <= 0) return 0
  return Math.round(shippingCents * (SHIPPING_PROMO.shippingPercentOff / 100))
}

type Locale = "en" | "ru" | "jp"

export const PROMO_TEXT: Record<Locale, {
  bar: string
  modalTitle: string
  modalBody: string
  modalCta: string
  modalRegister: string
  cartBanner: string
  cartApply: string
  cartApplied: string
  cartLine: string
  expired: string
}> = {
  en: {
    bar: "50% off shipping until Oct 5 · code SHIP50",
    modalTitle: "50% off shipping",
    modalBody: "Until October 5 (UTC), shipping is half price on every order. Use code SHIP50 at checkout — or apply it in your cart with one click.",
    modalCta: "Shop now",
    modalRegister: "or create a free account",
    cartBanner: "50% off shipping until Oct 5",
    cartApply: "Apply SHIP50",
    cartApplied: "SHIP50 applied — 50% off shipping",
    cartLine: "Shipping discount",
    expired: "This promo code has expired",
  },
  ru: {
    bar: "−50% на доставку до 5 октября · код SHIP50",
    modalTitle: "−50% на доставку",
    modalBody: "До 5 октября (UTC) доставка любого заказа за полцены. Введите код SHIP50 при оформлении — или примените его в корзине в один клик.",
    modalCta: "В магазин",
    modalRegister: "или создайте бесплатный аккаунт",
    cartBanner: "−50% на доставку до 5 октября",
    cartApply: "Применить SHIP50",
    cartApplied: "SHIP50 применён — доставка −50%",
    cartLine: "Скидка на доставку",
    expired: "Срок действия промокода истёк",
  },
  jp: {
    bar: "10月5日まで送料50%オフ · コード SHIP50",
    modalTitle: "送料50%オフ",
    modalBody: "10月5日（UTC）まで、全ての注文の送料が半額。チェックアウトでコード SHIP50 を入力、またはカートでワンクリック適用。",
    modalCta: "ショップへ",
    modalRegister: "または無料アカウントを作成",
    cartBanner: "10月5日まで送料50%オフ",
    cartApply: "SHIP50を適用",
    cartApplied: "SHIP50適用 — 送料50%オフ",
    cartLine: "送料割引",
    expired: "このプロモコードは期限切れです",
  },
}

export function localeFromPath(pathname: string | null | undefined): Locale {
  const p = pathname || "/"
  return p.startsWith("/ru") ? "ru" : p.startsWith("/jp") ? "jp" : "en"
}
