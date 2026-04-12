"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useCart } from "@/lib/cart-context"
import { getShippingInfo } from "@/lib/shipping"
import BatsOverlay from "@/components/BatsOverlay"
import type { Dict } from "@/lib/dict"

const COUNTRIES = [
  { code: "AR", name: "Argentina" }, { code: "AU", name: "Australia" }, { code: "AT", name: "Austria" },
  { code: "BE", name: "Belgium" }, { code: "BR", name: "Brazil" }, { code: "BG", name: "Bulgaria" },
  { code: "CA", name: "Canada" }, { code: "CL", name: "Chile" }, { code: "CO", name: "Colombia" },
  { code: "HR", name: "Croatia" }, { code: "CZ", name: "Czech Republic" }, { code: "DK", name: "Denmark" },
  { code: "EE", name: "Estonia" }, { code: "FI", name: "Finland" }, { code: "FR", name: "France" },
  { code: "DE", name: "Germany" }, { code: "GR", name: "Greece" }, { code: "HU", name: "Hungary" },
  { code: "IE", name: "Ireland" }, { code: "IL", name: "Israel" }, { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" }, { code: "LV", name: "Latvia" }, { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" }, { code: "MX", name: "Mexico" }, { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" }, { code: "NO", name: "Norway" }, { code: "PE", name: "Peru" },
  { code: "PL", name: "Poland" }, { code: "PT", name: "Portugal" }, { code: "RO", name: "Romania" },
  { code: "RU", name: "Russia" }, { code: "SA", name: "Saudi Arabia" }, { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" }, { code: "ES", name: "Spain" }, { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" }, { code: "TR", name: "Turkey" }, { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" }, { code: "US", name: "United States" },
]

interface AddressForm {
  fullName: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  zip: string
  phone: string
}

const emptyAddress: AddressForm = {
  fullName: "", addressLine1: "", addressLine2: "", city: "", state: "", zip: "", phone: "",
}

interface Props {
  dict: Dict
  shopHref: string
}

export default function CartPageContent({ dict, shopHref }: Props) {
  const { items, removeItem, setQuantity } = useCart()

  const [countryCode, setCountryCode] = useState("")
  const [countrySearch, setCountrySearch] = useState("")
  const [showDrop, setShowDrop] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  const [promoInput, setPromoInput] = useState("")
  const [appliedPromo, setAppliedPromo] = useState("")
  const [promoError, setPromoError] = useState("")
  const [upsellDismissed, setUpsellDismissed] = useState(false)

  const [showAddress, setShowAddress] = useState(false)
  const [address, setAddress] = useState<AddressForm>(emptyAddress)
  const [loading, setLoading] = useState(false)
  // Once Stripe gives us a redirect URL we set this to keep the
  // loading UI mounted until the browser actually navigates away.
  // Without it the empty-cart guard would briefly render between
  // clearCart() and the actual navigation. We also stopped clearing
  // the cart here entirely — the /order/success page does it.
  const [redirecting, setRedirecting] = useState(false)
  const [error, setError] = useState("")

  const filteredCountries = COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  )
  const selectedCountry = COUNTRIES.find((c) => c.code === countryCode)
  const shipping = getShippingInfo(countryCode)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setShowDrop(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const itemsSubtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  // Multi-item shipping discount: 40% off shipping when the cart has
  // 2+ distinct figures. Kept in sync with app/api/checkout/route.ts.
  const multiDiscount = items.length >= 2
  const shippingCents = countryCode && !shipping.blocked
    ? multiDiscount ? Math.round(shipping.priceCents * 0.60) : shipping.priceCents
    : 0
  const shippingOriginal = countryCode && !shipping.blocked ? shipping.priceCents : 0
  const shippingDisplay = `$${(shippingCents / 100).toFixed(2)}`

  const PROMO_RATES: Record<string, number> = {}
  const promoRate = appliedPromo ? (PROMO_RATES[appliedPromo] ?? 0) : 0
  const promoDiscountCents = promoRate > 0
    ? Math.round((itemsSubtotal + shippingCents) * (promoRate / 100))
    : 0
  const totalCents = itemsSubtotal + shippingCents - promoDiscountCents

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase()
    if (PROMO_RATES[code] !== undefined) {
      setAppliedPromo(code)
      setPromoError("")
    } else {
      setPromoError("Invalid promo code")
      setAppliedPromo("")
    }
  }

  const handlePay = async () => {
    if (!address.fullName || !address.addressLine1 || !address.city || !address.state || !address.zip || !address.phone) {
      setError("Please fill in all required fields")
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ listingId: i.listingId, quantity: i.quantity })),
          country: countryCode,
          promoCode: appliedPromo || undefined,
          shippingAddress: { ...address, country: countryCode },
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        // Surface the verbose diagnostic the API returns so we can
        // see the real Stripe error in the cart UI + browser console.
        console.error("[checkout] api error:", data)
        const detail = data.message || data.error || "Checkout failed"
        const stripeBit = data.stripe?.code ? ` (stripe: ${data.stripe.code})` : ""
        setError(`${detail}${stripeBit}`)
        return
      }
      if (data.url) {
        // Don't clear the cart here — clearCart() flips items.length
        // to 0 and re-renders the empty-cart screen before the
        // browser navigates, causing a 1-2s "cart is empty" flash.
        // The /order/success page clears the cart on mount instead.
        setRedirecting(true)
        window.location.href = data.url
        return
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      // Don't drop the loading state if we're already redirecting —
      // the spinner needs to stay until the browser leaves the page.
      if (!redirecting) setLoading(false)
    }
  }

  if (items.length === 0 && !redirecting) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <BatsOverlay />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[#ff2d78]/5 blur-[180px] pointer-events-none" />
        <div className="relative z-20">
          <span className="text-6xl block mb-4 opacity-30">🛒</span>
          <h1 className="text-2xl font-black text-white mb-2">{dict.cart_empty_heading}</h1>
          <p className="text-white/35 mb-8">{dict.cart_empty_sub}</p>
          <Link
            href={shopHref}
            className="inline-block px-6 py-3 rounded-full font-bold text-white transition-opacity"
            style={{ backgroundColor: "#ff2d78" }}
          >
            {dict.cart_go_shop}
          </Link>
        </div>
      </div>
    )
  }

  const addressFields = [
    { key: "fullName", label: dict.cart_field_fullname, placeholder: "Jane Smith", type: "text" },
    { key: "addressLine1", label: dict.cart_field_addr1, placeholder: "123 Main St", type: "text" },
    { key: "addressLine2", label: dict.cart_field_addr2, placeholder: "Apt 4B", type: "text" },
    { key: "city", label: dict.cart_field_city, placeholder: "New York", type: "text" },
    { key: "state", label: dict.cart_field_state, placeholder: "NY", type: "text" },
    { key: "zip", label: dict.cart_field_zip, placeholder: "10001", type: "text" },
    { key: "phone", label: dict.cart_field_phone, placeholder: "+1 555 000 0000", type: "tel" },
  ] as const

  return (
    <div className="relative min-h-screen">
      <BatsOverlay />
      <div className="absolute top-1/4 right-1/3 w-[600px] h-[600px] rounded-full bg-[#ff2d78]/5 blur-[180px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-purple-900/6 blur-[120px] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="mb-8">
            <span className="inline-block w-8 h-px bg-[#ff2d78] mb-4" />
            <h1
              className="font-black lowercase leading-tight tracking-tighter text-white"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
            >
              {dict.cart_heading}
            </h1>
            <p className="text-white/35 mt-2 text-sm">
              {items.length} {items.length === 1 ? dict.cart_item_suffix : dict.cart_items_suffix}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Items list */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div
                  key={item.listingId}
                  className="flex gap-4 rounded-2xl border border-white/[0.06] p-4"
                  style={{ background: "rgba(255,255,255,0.02)" }}
                >
                  <Link href={`/shop/${item.listingId}`} className="flex-shrink-0">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/[0.06]" style={{ background: "#0a0a0a" }}>
                      {item.figureImageUrl ? (
                        <Image
                          src={item.figureImageUrl}
                          alt={item.figureName}
                          fill
                          // Bypass Vercel image optimizer; same fix
                          // as FigureCard / ListingCard.
                          unoptimized
                          className="object-cover object-top"
                          sizes="80px"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-2xl opacity-30">🦇</div>
                      )}
                    </div>
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link href={`/shop/${item.listingId}`}>
                      <h3 className="font-bold text-white text-sm leading-tight hover:text-[#ff2d78] transition-colors line-clamp-2">
                        {item.figureName}
                      </h3>
                    </Link>
                    <p className="text-white/35 text-xs mt-0.5">{item.figureSeries}</p>
                    <span className="badge badge-violet text-[10px] mt-1 inline-block">{item.condition}</span>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setQuantity(item.listingId, item.quantity - 1)}
                          className="w-6 h-6 rounded border border-white/[0.12] text-white/50 hover:text-white hover:border-[#ff2d78] transition-colors text-xs flex items-center justify-center"
                        >
                          −
                        </button>
                        <span className="text-white text-sm font-medium w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => setQuantity(item.listingId, item.quantity + 1)}
                          className="w-6 h-6 rounded border border-white/[0.12] text-white/50 hover:text-white hover:border-[#ff2d78] transition-colors text-xs flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-bold text-white">
                          ${((item.price * item.quantity) / 100).toFixed(2)}
                        </span>
                        <button
                          onClick={() => removeItem(item.listingId)}
                          className="text-white/20 hover:text-red-400 transition-colors"
                          title={dict.cart_promo_remove}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Order summary */}
            <div className="space-y-4">
              {/* Country selector */}
              <div className="rounded-2xl border border-white/[0.06] p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
                <h3 className="font-bold text-white text-sm mb-4">{dict.cart_shipping_dest}</h3>
                <div ref={dropRef} className="relative">
                  <input
                    type="text"
                    value={countrySearch}
                    onChange={(e) => { setCountrySearch(e.target.value); setCountryCode(""); setShowDrop(true) }}
                    onFocus={() => setShowDrop(true)}
                    placeholder={dict.cart_country_ph}
                    autoComplete="off"
                    className="input text-sm"
                  />
                  {showDrop && filteredCountries.length > 0 && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-44 overflow-y-auto rounded-lg border border-white/[0.08] bg-[#0f0f1a] shadow-xl">
                      {filteredCountries.map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          onMouseDown={() => { setCountryCode(c.code); setCountrySearch(c.name); setShowDrop(false) }}
                          className="w-full text-left px-3 py-2 text-sm text-white/70 hover:bg-white/[0.05] hover:text-white transition-colors"
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {countryCode && shipping.blocked && (
                  <p className="mt-3 text-sm text-amber-400 leading-relaxed">{shipping.blockedMessage}</p>
                )}
                {countryCode && !shipping.blocked && multiDiscount && (
                  <p className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {dict.cart_multi_discount}
                  </p>
                )}
              </div>

              {/* Upsell banner — shown only when cart has exactly 1 item */}
              {items.length === 1 && !upsellDismissed && (
                <div
                  className="relative rounded-2xl border border-[#ff2d78]/40 p-4 pr-10"
                  style={{ background: "rgba(255,45,120,0.06)" }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl leading-none mt-0.5">🦇</span>
                    <p className="text-sm text-white/85 font-medium leading-snug">
                      {dict.cart_upsell_banner}
                    </p>
                  </div>
                  <button
                    onClick={() => setUpsellDismissed(true)}
                    aria-label="Dismiss"
                    className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Promo code */}
              <div className="rounded-2xl border border-white/[0.06] p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
                <h3 className="font-bold text-white text-sm mb-3">{dict.cart_promo_heading}</h3>
                {appliedPromo ? (
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400 text-sm font-medium flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {appliedPromo} ({PROMO_RATES[appliedPromo]}% off)
                    </span>
                    <button
                      onClick={() => { setAppliedPromo(""); setPromoInput("") }}
                      className="text-white/25 hover:text-red-400 text-xs transition-colors"
                    >
                      {dict.cart_promo_remove}
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => { setPromoInput(e.target.value); setPromoError("") }}
                      placeholder={dict.cart_promo_ph}
                      className="input text-sm flex-1"
                      onKeyDown={(e) => e.key === "Enter" && applyPromo()}
                    />
                    <button
                      onClick={applyPromo}
                      className="px-3 py-2 rounded-lg text-white text-sm font-bold transition-opacity"
                      style={{ backgroundColor: "#ff2d78" }}
                    >
                      {dict.cart_promo_apply}
                    </button>
                  </div>
                )}
                {promoError && <p className="text-red-400 text-xs mt-1">{promoError}</p>}
              </div>

              {/* Price summary */}
              <div className="rounded-2xl border border-white/[0.06] p-5 space-y-3" style={{ background: "rgba(255,255,255,0.02)" }}>
                <h3 className="font-bold text-white text-sm">{dict.cart_order_summary}</h3>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-white/50">
                    <span>{dict.cart_subtotal} ({items.length})</span>
                    <span>${(itemsSubtotal / 100).toFixed(2)}</span>
                  </div>

                  {countryCode && !shipping.blocked ? (
                    <>
                      <div className="flex justify-between text-white/50">
                        <span>
                          {dict.cart_shipping} ({selectedCountry?.name})
                          {multiDiscount && <span className="text-emerald-400 ml-1 text-xs">{dict.cart_multi_discount_percent}</span>}
                        </span>
                        <span>
                          {multiDiscount && (
                            <span className="text-white/25 line-through mr-1 text-xs">
                              ${(shippingOriginal / 100).toFixed(2)}
                            </span>
                          )}
                          {shippingDisplay}
                        </span>
                      </div>
                      {multiDiscount && (
                        <div className="flex justify-between text-emerald-400 text-xs">
                          <span>{dict.cart_multi_discount_line}</span>
                          <span>−${((shippingOriginal - shippingCents) / 100).toFixed(2)}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex justify-between text-white/30">
                      <span>{dict.cart_shipping}</span>
                      <span>{dict.cart_shipping_select}</span>
                    </div>
                  )}

                  {promoDiscountCents > 0 && (
                    <div className="flex justify-between text-emerald-400 text-xs">
                      <span>Promo ({appliedPromo})</span>
                      <span>−${(promoDiscountCents / 100).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between font-black text-white border-t border-white/[0.06] pt-3">
                  <span>{dict.cart_total}</span>
                  <span style={{ color: "#ff2d78" }}>
                    {countryCode && !shipping.blocked
                      ? `$${(totalCents / 100).toFixed(2)}`
                      : `$${(itemsSubtotal / 100).toFixed(2)} + shipping`}
                  </span>
                </div>

                {!showAddress && (
                  <button
                    onClick={() => setShowAddress(true)}
                    disabled={!countryCode || shipping.blocked}
                    className="w-full py-3 font-bold rounded-lg text-white transition-opacity disabled:opacity-40 disabled:cursor-not-allowed mt-1"
                    style={{ backgroundColor: "#ff2d78" }}
                  >
                    {dict.cart_proceed}
                  </button>
                )}
              </div>

              {/* Address form */}
              {showAddress && (
                <div className="rounded-2xl border border-white/[0.06] p-5 space-y-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <h3 className="font-bold text-white text-sm">{dict.cart_address_heading}</h3>

                  {addressFields.map(({ key, label, placeholder, type }) => (
                    <div key={key}>
                      <label className="block text-xs text-white/40 mb-1.5 font-medium">{label}</label>
                      <input
                        type={type}
                        value={address[key]}
                        onChange={(e) => setAddress((prev) => ({ ...prev, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="input text-sm"
                      />
                    </div>
                  ))}

                  {error && (
                    <p className="text-red-400 text-sm bg-red-900/20 border border-red-900/50 rounded-lg px-3 py-2">
                      {error}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={handlePay}
                      disabled={loading || redirecting}
                      className="flex-1 py-3 font-bold rounded-lg text-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: "#ff2d78" }}
                    >
                      {loading || redirecting ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          {dict.cart_paying}
                        </span>
                      ) : (
                        dict.cart_pay
                      )}
                    </button>
                    <button
                      onClick={() => setShowAddress(false)}
                      disabled={loading}
                      className="btn-ghost px-3 text-sm"
                    >
                      Back
                    </button>
                  </div>
                  <p className="text-xs text-white/20 text-center">{dict.cart_stripe_note}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
