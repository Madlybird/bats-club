import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Navbar from "@/components/Navbar"
import Providers from "@/components/Providers"
import Toaster from "@/components/Toaster"
import Footer from "@/components/Footer"

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
        <script type="text/javascript" src="//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js" async />
      </head>
      <body
        className="min-h-screen text-slate-200 antialiased font-inter overflow-x-clip"
      >
        <Providers>
          <Navbar />
          <Toaster />
          <main className="overflow-x-clip">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
