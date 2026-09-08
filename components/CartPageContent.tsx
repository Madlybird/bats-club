"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useCart } from "@/lib/cart-context"
import { getShippingInfo, getArtShippingInfo, artCategoryMax, MAX_ORDER_QUANTITY } from "@/lib/shipping"
import { trackProceedToCheckout, trackBeginCheckout } from "@/lib/analytics"
import BatsOverlay from "@/components/BatsOverlay"
import type { Dict } from "@/lib/dict"

const COUNTRIES = [
  { code: "AR", name: "Argentina" }, { code: "AU", name: "Australia" }, { code: "AT", name: "Austria" },
  { code: "BE", name: "Belgium" }, { code: "BR", name: "Brazil" }, { code: "BG", name: "Bulgaria" },
  { code: "CA", name: "Canada" }, { code: "CL", name: "Chile" }, { code: "CO", name: "Colombia" },
  { code: "HR", name: "Croatia" }, { code: "CZ", name: "Czech Republic" }, { code: "DK", name: "Denmark" },
  { code: "EE", name: "Estonia" }, { code: "FI", name: "Finland" }, { code: "FR", name: "France" },
  { code: "DE", name: "Germany" }, { code: "GR", name: "Greece" }, { code: "HU", name: "Hungary" },
  { code: "IE", name: "Ireland" }, { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" }, { code: "LV", name: "Latvia" }, { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" }, { code: "MX", name: "Mexico" }, { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" }, { code: "NO", name: "Norway" }, { code: "PE", name: "Peru" },
  { code: "PL", name: "Poland" }, { code: "PT", name: "Portugal" }, { code: "RO", name: "Romania" },
  { code: "RU", name: "Russia" }, { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" }, { code: "ES", name: "Spain" }, { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "GB", name: "United Kingdom" }, { code: "US", name: "United States" },
]

interface AddressForm {
  phone: string
}

const emptyAddress: AddressForm = {
  phone: "",
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

  const [showAddress, setShowAddress] = useState(false)
  const [address, setAddress] = useState<AddressForm>(emptyAddress)
  const [loading, setLoading] = useState(false)
  // Keep loading UI mounted until the browser actually navigates to
  // Stripe — stops the empty-cart flash between clearCart() and
  // navigation. Cart is cleared on /order/success instead.
  const [redirecting, setRedirecting] = useState(false)
  const [error, setError] = useState("")

  // ── Split cart: figures use the tiered per-order table (max 3, selectable
  //    when over), art ships as one weight-priced ePacket parcel with a
  //    per-type quantity cap. A mixed cart pays both.
  const figureItems = items.filter((i) => i.kind !== "art")
  const artItems = items.filter((i) => i.kind === "art")

  const figureOverLimit = figureItems.length > MAX_ORDER_QUANTITY
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Prune selection when figure items leave the cart.
  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set<string>()
      for (const id of Array.from(prev)) {
        if (figureItems.some((i) => i.listingId === id)) next.add(id)
      }
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  const effectiveFigureItems = figureOverLimit
    ? figureItems.filter((i) => selectedIds.has(i.listingId))
    : figureItems
  const effectiveItems = [...effectiveFigureItems, ...artItems]
  const effectiveUnits = effectiveItems.reduce((n, i) => n + i.quantity, 0)

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < MAX_ORDER_QUANTITY) {
        next.add(id)
      }
      return next
    })
  }

  const filteredCountries = COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  )
  const selectedCountry = COUNTRIES.find((c) => c.code === countryCode)

  // Anything that actually ships: every figure, plus non-digital art. A cart of
  // only digital downloads needs no country, no address, no shipping line.
  const hasPhysical = effectiveItems.some((i) => i.kind !== "art" || !i.isDigital)

  // Figures and art ship separately, each on its own model; a mixed cart pays both.
  const figShip = effectiveFigureItems.length > 0
    ? getShippingInfo(countryCode, effectiveFigureItems.length)
    : null
  const artShip = artItems.length > 0
    ? getArtShippingInfo(
        countryCode,
        artItems.map((i) => ({
          type: i.artType ?? "",
          quantity: i.quantity,
          isDigital: i.isDigital,
        }))
      )
    : null
  const shippingBlocked = Boolean(figShip?.blocked || artShip?.blocked)
  const shippingBlockedMsg = figShip?.blocked
    ? figShip.blockedMessage
    : artShip?.blocked
      ? artShip.blockedMessage
      : ""
  const artLineOverCap = artItems.some(
    (i) => !i.isDigital && i.quantity > artCategoryMax(i.artType ?? "")
  )

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setShowDrop(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const itemsSubtotal = effectiveItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const shippingReady = hasPhysical ? Boolean(countryCode) : true
  const shippingCents = shippingReady && !shippingBlocked && effectiveItems.length > 0
    ? (figShip?.priceCents ?? 0) + (artShip?.priceCents ?? 0)
    : 0
  const shippingDisplay = `$${(shippingCents / 100).toFixed(2)}`
  const shippingBreakdown =
    figShip && (artShip?.priceCents ?? 0) > 0 && !shippingBlocked
      ? `Figures ${figShip.priceDisplay} + Art ${artShip!.priceDisplay} — ship separately`
      : ""

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

  // Can the user move past the selection step?
  const figureSelectionValid = figureOverLimit
    ? effectiveFigureItems.length >= 1 && effectiveFigureItems.length <= MAX_ORDER_QUANTITY
    : true
  const selectionValid =
    effectiveItems.length >= 1 && figureSelectionValid && !artLineOverCap && !shippingBlocked

  const handlePay = async () => {
    if (hasPhysical && !address.phone) {
      setError("Please fill in all required fields")
      return
    }
    if (!selectionValid) {
      setError(dict.cart_max_warning)
      return
    }
    setLoading(true)
    setError("")
    trackBeginCheckout(totalCents, effectiveUnits)
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: effectiveItems.map((i) => ({ listingId: i.listingId, quantity: i.quantity })),
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
    { key: "phone", label: dict.cart_field_phone, placeholder: "+1 555 000 0000", type: "tel" },
  ] as const

  const selectedCount = figureOverLimit ? selectedIds.size : figureItems.length
  const selectedCountLabel = dict.cart_selected_count.replace("{X}", String(selectedCount))
  const artTooHeavy = Boolean(
    artShip?.blocked && artShip.blockedMessage.toLowerCase().includes("2 kg"),
  )

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

          {figureOverLimit && (
            <div
              className="mb-6 rounded-2xl border border-amber-400/40 p-4 flex items-start gap-3"
              style={{ background: "rgba(251,191,36,0.06)" }}
            >
              <svg className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-white/90 leading-snug">{dict.cart_max_warning}</p>
                <p className="text-xs text-amber-300 mt-1">{selectedCountLabel}</p>
              </div>
            </div>
          )}

          {artTooHeavy && (
            <div
              className="mb-6 rounded-2xl border border-amber-400/40 p-4 flex items-start gap-3"
              style={{ background: "rgba(251,191,36,0.06)" }}
            >
              <svg className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm font-medium text-white/90 leading-snug flex-1">{dict.cart_art_too_heavy}</p>
            </div>
          )}

          {artLineOverCap && (
            <div
              className="mb-6 rounded-2xl border border-amber-400/40 p-4 flex items-start gap-3"
              style={{ background: "rgba(251,191,36,0.06)" }}
            >
              <svg className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm font-medium text-white/90 leading-snug flex-1">{dict.cart_art_over_cap}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Items list */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const isArt = item.kind === "art"
                const isDigitalArt = isArt && !!item.isDigital
                const detailHref = isArt ? `/art/${item.listingId}` : `/shop/${item.listingId}`
                const cap = artCategoryMax(item.artType ?? "")
                const showCheckbox = figureOverLimit && !isArt
                const isSelected = selectedIds.has(item.listingId)
                const canSelectMore = selectedIds.size < MAX_ORDER_QUANTITY
                const checkboxDisabled = showCheckbox && !isSelected && !canSelectMore
                return (
                  <div
                    key={item.listingId}
                    className={`flex gap-4 rounded-2xl border p-4 transition-colors ${
                      showCheckbox && isSelected
                        ? "border-[#ff2d78]/50"
                        : "border-white/[0.06]"
                    } ${showCheckbox && !isSelected ? "opacity-70" : ""}`}
                    style={{ background: "rgba(255,255,255,0.02)" }}
                  >
                    {showCheckbox && (
                      <label className="flex-shrink-0 self-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={checkboxDisabled}
                          onChange={() => toggleSelect(item.listingId)}
                          className="sr-only peer"
                        />
                        <span
                          className={`block w-5 h-5 rounded border-2 transition-colors flex items-center justify-center ${
                            checkboxDisabled
                              ? "border-white/10 bg-white/[0.02] cursor-not-allowed"
                              : isSelected
                                ? "border-[#ff2d78] bg-[#ff2d78]"
                                : "border-white/30 bg-transparent hover:border-white/60"
                          }`}
                        >
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                      </label>
                    )}

                    <Link href={detailHref} className="flex-shrink-0">
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
                      <Link href={detailHref}>
                        <h3 className="font-bold text-white text-sm leading-tight hover:text-[#ff2d78] transition-colors line-clamp-2">
                          {item.figureName}
                        </h3>
                      </Link>
                      <p className="text-white/35 text-xs mt-0.5">{item.figureSeries}</p>
                      <span className="badge badge-violet text-[10px] mt-1 inline-block">
                        {isDigitalArt ? dict.cart_digital_badge : item.condition}
                      </span>
                      {isArt && !isDigitalArt && item.quantity > cap && (
                        <p className="text-[11px] text-amber-400 mt-1">
                          {dict.cart_art_item_cap.replace("{X}", String(cap))}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          {isDigitalArt ? (
                            <span className="text-white/40 text-xs">{dict.cart_digital_note}</span>
                          ) : (
                            <>
                              <button
                                onClick={() => setQuantity(item.listingId, item.quantity - 1)}
                                disabled={isArt && item.quantity <= 1}
                                className="w-6 h-6 rounded border border-white/[0.12] text-white/50 hover:text-white hover:border-[#ff2d78] transition-colors text-xs flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                                aria-label="Decrease quantity"
                              >
                                −
                              </button>
                              {isArt && (
                                <>
                                  <span className="text-white/70 text-sm font-medium w-5 text-center tabular-nums">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() => setQuantity(item.listingId, Math.min(cap, item.quantity + 1))}
                                    disabled={item.quantity >= cap}
                                    className="w-6 h-6 rounded border border-white/[0.12] text-white/50 hover:text-white hover:border-[#ff2d78] transition-colors text-xs flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                                    aria-label="Increase quantity"
                                  >
                                    +
                                  </button>
                                </>
                              )}
                            </>
                          )}
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
                )
              })}

              {!figureOverLimit && figureItems.length > 0 && (
                <p className="text-xs text-white/35 pt-1">{dict.cart_max_info}</p>
              )}
            </div>

            {/* Right: Order summary */}
            <div className="space-y-4">
              {/* Country selector — only when something physical ships */}
              {hasPhysical && (
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
                    className="input text-base sm:text-sm"
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
                {countryCode && shippingBlocked && (
                  <p className="mt-3 text-sm text-amber-400 leading-relaxed">{shippingBlockedMsg}</p>
                )}
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
                      className="input text-base sm:text-sm flex-1"
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
                    <span>{dict.cart_subtotal} ({effectiveUnits})</span>
                    <span>${(itemsSubtotal / 100).toFixed(2)}</span>
                  </div>

                  {hasPhysical && countryCode && !shippingBlocked && effectiveItems.length > 0 && (
                    <div className="flex justify-between text-white/50">
                      <span>
                        {dict.cart_shipping} ({selectedCountry?.name})
                      </span>
                      <span>{shippingDisplay}</span>
                    </div>
                  )}
                  {shippingBreakdown && (
                    <p className="text-[11px] text-white/30 -mt-1">{shippingBreakdown}</p>
                  )}
                  {!hasPhysical && effectiveItems.length > 0 && (
                    <div className="flex justify-between text-white/50">
                      <span>{dict.cart_shipping}</span>
                      <span>{dict.cart_digital_free_ship}</span>
                    </div>
                  )}

                  {promoDiscountCents > 0 && (
                    <div className="flex justify-between text-emerald-400 text-xs">
                      <span>Promo ({appliedPromo})</span>
                      <span>−${(promoDiscountCents / 100).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {shippingReady && !shippingBlocked && effectiveItems.length > 0 ? (
                  <div className="flex justify-between font-black text-white border-t border-white/[0.06] pt-3">
                    <span>{dict.cart_total}</span>
                    <span style={{ color: "#ff2d78" }}>
                      ${(totalCents / 100).toFixed(2)}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-white/40 text-center border-t border-white/[0.06] pt-3">
                    {dict.cart_shipping_prompt}
                  </p>
                )}

                {figureOverLimit && (
                  <p className="text-xs text-white/40 text-center">{selectedCountLabel}</p>
                )}

                {!showAddress && (
                  <button
                    onClick={() => {
                      trackProceedToCheckout(totalCents, effectiveUnits)
                      if (hasPhysical) setShowAddress(true)
                      else handlePay()
                    }}
                    disabled={!shippingReady || shippingBlocked || !selectionValid || loading || redirecting}
                    className="w-full py-3 font-bold rounded-lg text-white transition-opacity disabled:opacity-40 disabled:cursor-not-allowed mt-1"
                    style={{ backgroundColor: "#ff2d78" }}
                  >
                    {loading || redirecting ? dict.cart_paying : hasPhysical ? dict.cart_proceed : dict.cart_pay}
                  </button>
                )}
                {!showAddress && !hasPhysical && error && (
                  <p className="text-red-400 text-sm bg-red-900/20 border border-red-900/50 rounded-lg px-3 py-2">
                    {error}
                  </p>
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
                        className="input text-base sm:text-sm"
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
                      disabled={loading || redirecting || !selectionValid}
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
