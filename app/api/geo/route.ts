import { NextResponse } from "next/server"

// EU 27 + EEA (Iceland, Liechtenstein, Norway) + UK — the regions where
// GDPR/UK-GDPR/PECR require opt-in consent before analytics/ad cookies.
// Kept in sync with the 'region' list in app/layout.tsx's Consent Mode
// default — that list gates the actual cookie behaviour via Google's own
// geo lookup, this one only decides whether to render the banner UI.
const CONSENT_REQUIRED_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK",
  "SI", "ES", "SE", "IS", "LI", "NO", "GB",
])

export async function GET(req: Request) {
  const country = req.headers.get("x-vercel-ip-country")
  const consentRequired = country ? CONSENT_REQUIRED_COUNTRIES.has(country) : false
  return NextResponse.json({ consentRequired })
}
