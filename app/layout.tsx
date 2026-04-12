import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Navbar from "@/components/Navbar"
import Providers from "@/components/Providers"
import Toaster from "@/components/Toaster"
import Footer from "@/components/Footer"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  // Root-level title/description are used as fallbacks. Most top-level
  // pages override these in their own `export const metadata`.
  title: {
    default: "Bats Club — Rare Anime Figure Archive & Marketplace",
    template: "%s | Bats Club",
  },
  description:
    "Authentic rare anime figures from a private collector. 1990s–2000s Japanese originals. Di Gi Charat, Evangelion, and more. Ships worldwide.",
  keywords: ["anime figures", "figure collecting", "marketplace", "archive"],
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
      <body
        className="min-h-screen text-slate-200 antialiased font-inter"
      >
        <Providers>
          <Navbar />
          <Toaster />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
