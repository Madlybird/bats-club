// Member welcome offer: a registered member's first paid order ships at
// 50% off. Applied automatically — no code to type. The checkout API
// re-checks eligibility server-side (lib/member-offer.server.ts); the cart
// only mirrors it for display.

export const MEMBER_OFFER_ID = "member_first_order_ship50"
export const MEMBER_SHIP_PERCENT_OFF = 50

export function memberShipDiscountCents(shippingCents: number): number {
  if (shippingCents <= 0) return 0
  return Math.floor((shippingCents * MEMBER_SHIP_PERCENT_OFF) / 100)
}
