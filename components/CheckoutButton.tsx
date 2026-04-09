"use client"

import { useState, useRef, useEffect } from "react"
import { getShippingInfo } from "@/lib/shipping"

const COUNTRIES = [
  // Europe
  { code: "AT", name: "Austria" },
  { code: "BE", name: "Belgium" },
  { code: "BG", name: "Bulgaria" },
  { code: "HR", name: "Croatia" },
  { code: "CZ", name: "Czech Republic" },
  { code: "DK", name: "Denmark" },
  { code: "EE", name: "Estonia" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "GR", name: "Greece" },
  { code: "HU", name: "Hungary" },
  { code: "IE", name: "Ireland" },
  { code: "IT", name: "Italy" },
  { code: "LV", name: "Latvia" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "NL", name: "Netherlands" },
  { code: "NO", name: "Norway" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "RO", name: "Romania" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "ES", name: "Spain" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "GB", name: "United Kingdom" },
  // Americas
  { code: "AR", name: "Argentina" },
  { code: "BR", name: "Brazil" },
  { code: "CA", name: "Canada" },
  { code: "CL", name: "Chile" },
  { code: "CO", name: "Colombia" },
  { code: "MX", name: "Mexico" },
  { code: "PE", name: "Peru" },
  { code: "US", name: "United States" },
  // Asia (limited)
  { code: "JP", name: "Japan" },
  // Other
  { code: "AU", name: "Australia" },
  { code: "IL", name: "Israel" },
  { code: "NZ", name: "New Zealand" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "TR", name: "Turkey" },
  { code: "AE", name: "United Arab Emirates" },
  // Russia
  { code: "RU", name: "Russia" },
]

interface CheckoutButtonProps {
  listingId: string
  listingPrice: number // in cents
}

interface AddressForm {
  fullName: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  zip: string
  country: string
  phone: string
}

const emptyForm: AddressForm = {
  fullName: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  zip: "",
  country: "",
  phone: "",
}

export default function CheckoutButton({ listingId, listingPrice }: CheckoutButtonProps) {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState<AddressForm>(emptyForm)

  // Country search dropdown
  const [countrySearch, setCountrySearch] = useState("")
  const [showCountryDrop, setShowCountryDrop] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  const filteredCountries = COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  )

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setShowCountryDrop(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const selectedCountry = COUNTRIES.find((c) => c.code === form.country)
  const shipping = getShippingInfo(form.country)

  const totalCents = form.country && !shipping.blocked
    ? listingPrice + shipping.priceCents
    : listingPrice

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const selectCountry = (code: string, name: string) => {
    setForm((prev) => ({ ...prev, country: code }))
    setCountrySearch(name)
    setShowCountryDrop(false)
  }

  const handleCheckout = async () => {
    if (!form.fullName.trim() || !form.addressLine1.trim() || !form.city.trim() ||
        !form.state.trim() || !form.zip.trim() || !form.country || !form.phone.trim()) {
      setError("Please fill in all required fields")
      return
    }
    if (shipping.blocked) return

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, shippingAddress: form }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Checkout failed")
        return
      }

      const { url } = await res.json()
      if (url) window.location.href = url
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full text-center py-3 text-base font-bold rounded-lg text-white transition-opacity"
        style={{ backgroundColor: "#ff2d78" }}
      >
        Proceed to Checkout
      </button>
    )
  }

  return (
    <div className="card p-5 space-y-4 border-white/[0.06]">
      <h3 className="font-bold text-white text-sm uppercase tracking-wider">Shipping Address</h3>

      {/* Full Name */}
      <div>
        <label className="block text-xs text-white/40 mb-1.5 font-medium">
          Full Name <span className="text-[#ff2d78]">*</span>
        </label>
        <input
          type="text"
          name="fullName"
          value={form.fullName}
          onChange={handleChange}
          placeholder="Jane Smith"
          className="input text-sm"
        />
      </div>

      {/* Address Line 1 */}
      <div>
        <label className="block text-xs text-white/40 mb-1.5 font-medium">
          Address Line 1 <span className="text-[#ff2d78]">*</span>
        </label>
        <input
          type="text"
          name="addressLine1"
          value={form.addressLine1}
          onChange={handleChange}
          placeholder="123 Main St, Building A"
          className="input text-sm"
        />
      </div>

      {/* Address Line 2 */}
      <div>
        <label className="block text-xs text-white/40 mb-1.5 font-medium">
          Address Line 2{" "}
          <span className="text-white/20">(apartment, optional)</span>
        </label>
        <input
          type="text"
          name="addressLine2"
          value={form.addressLine2}
          onChange={handleChange}
          placeholder="Apt 4B"
          className="input text-sm"
        />
      </div>

      {/* City + State row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-white/40 mb-1.5 font-medium">
            City <span className="text-[#ff2d78]">*</span>
          </label>
          <input
            type="text"
            name="city"
            value={form.city}
            onChange={handleChange}
            placeholder="New York"
            className="input text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1.5 font-medium">
            State / Province <span className="text-[#ff2d78]">*</span>
          </label>
          <input
            type="text"
            name="state"
            value={form.state}
            onChange={handleChange}
            placeholder="NY"
            className="input text-sm"
          />
        </div>
      </div>

      {/* ZIP */}
      <div>
        <label className="block text-xs text-white/40 mb-1.5 font-medium">
          ZIP / Postal Code <span className="text-[#ff2d78]">*</span>
        </label>
        <input
          type="text"
          name="zip"
          value={form.zip}
          onChange={handleChange}
          placeholder="10001"
          className="input text-sm"
        />
      </div>

      {/* Country — searchable dropdown */}
      <div ref={dropRef} className="relative">
        <label className="block text-xs text-white/40 mb-1.5 font-medium">
          Country <span className="text-[#ff2d78]">*</span>
        </label>
        <input
          type="text"
          value={countrySearch}
          onChange={(e) => {
            setCountrySearch(e.target.value)
            setForm((prev) => ({ ...prev, country: "" }))
            setShowCountryDrop(true)
          }}
          onFocus={() => setShowCountryDrop(true)}
          placeholder="Search country…"
          autoComplete="off"
          className="input text-sm"
        />
        {showCountryDrop && filteredCountries.length > 0 && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-white/[0.08] bg-[#0f0f1a] shadow-xl">
            {filteredCountries.map((c) => (
              <button
                key={c.code}
                type="button"
                onMouseDown={() => selectCountry(c.code, c.name)}
                className="w-full text-left px-3 py-2 text-sm text-white/70 hover:bg-white/[0.05] hover:text-white transition-colors"
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Phone */}
      <div>
        <label className="block text-xs text-white/40 mb-1.5 font-medium">
          Phone Number <span className="text-[#ff2d78]">*</span>
        </label>
        <input
          type="tel"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="+1 555 000 0000"
          className="input text-sm"
        />
      </div>

      {/* Shipping / total summary */}
      {form.country && (
        <div className="rounded-lg border border-white/[0.06] p-3 bg-white/[0.02]">
          {shipping.blocked ? (
            <p className="text-sm text-amber-400 leading-relaxed">{shipping.blockedMessage}</p>
          ) : (
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-white/50">
                <span>Item</span>
                <span>${(listingPrice / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-white/50">
                <span>Shipping ({selectedCountry?.name})</span>
                <span>{shipping.priceDisplay}</span>
              </div>
              <div className="flex justify-between font-bold text-white border-t border-white/[0.06] pt-1 mt-1">
                <span>Total</span>
                <span style={{ color: "#ff2d78" }}>${(totalCents / 100).toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-red-400 text-sm bg-red-900/20 border border-red-900/50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleCheckout}
          disabled={loading || shipping.blocked || !form.country}
          className="flex-1 py-2.5 font-bold rounded-lg text-white transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#ff2d78" }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Redirecting to Stripe...
            </span>
          ) : (
            "Pay with Stripe"
          )}
        </button>
        <button
          onClick={() => setShowForm(false)}
          disabled={loading}
          className="btn-ghost px-3"
        >
          Cancel
        </button>
      </div>

      <p className="text-xs text-white/20 text-center">Secure payment powered by Stripe</p>
    </div>
  )
}
