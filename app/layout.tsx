import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Navbar from "@/components/Navbar"
import Providers from "@/components/Providers"
import Toaster from "@/components/Toaster"
import Footer from "@/components/Footer"
import RegisterPrompt from "@/components/RegisterPrompt"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  metadataBase: new URL("https://batsclub.com"),
  title: {
    default: "Bats Club — Rare Anime Figure Archive & Marketplace",
    template: "%s | Bats Club",
  },
  description:
    "Authentic rare anime figures from a private collector. 1990s–2000s Japanese originals. Di Gi Charat, Evangelion, and more. Ships worldwide.",
  keywords: ["anime figures", "figure collecting", "marketplace", "archive"],
  alternates: {
    canonical: "https://batsclub.com/",
    languages: {
      en: "https://batsclub.com/",
      ru: "https://batsclub.com/ru",
      ja: "https://batsclub.com/jp",
      "x-default": "https://batsclub.com/",
    },
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
}

// Site-wide entity schema: nothing declared batsclub.com as a single
// Organization before — only a bare `seller: Organization` nested
// inside each product's Offer. This is the one place that ties the
// brand identity (logo, description, social profiles) to the domain
// itself, independent of any single product page. Added 2026-08-13
// alongside FAQPage schema as part of the AEO pass.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Bats Club",
  url: "https://batsclub.com",
  logo: "https://batsclub.com/logo.png",
  description:
    "Private anime figure archive and marketplace. Rare vintage Japanese anime figures from the 1990s-2000s, sold directly from a single private collection.",
  email: "support@batsclub.com",
  sameAs: [
    "https://www.youtube.com/@bats4club",
    "https://www.pinterest.com/bats_club/",
    "https://www.tiktok.com/@batsclub",
    "https://www.trustpilot.com/review/batsclub.com",
  ],
}

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Bats Club",
  url: "https://batsclub.com",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-V3EEKGR3QM" />
        <script dangerouslySetInnerHTML={{ __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-V3EEKGR3QM');
        ` }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c") }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c") }}
        />
        {/* Trustpilot bootstrap script removed 2026-08-13 alongside the
            footer widget — nothing on the page uses it anymore, no
            reason to load it. Re-add when the widget comes back. */}
      </head>
      <body
        className="min-h-screen text-slate-200 antialiased font-inter overflow-x-clip"
      >
        <Providers>
          <Navbar />
          <Toaster />
          <main className="overflow-x-clip">{children}</main>
          <Footer />
          <RegisterPrompt />
        </Providers>
      </body>
    </html>
  )
}
