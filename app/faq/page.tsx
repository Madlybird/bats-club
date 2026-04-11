import { Metadata } from "next"
import InfoPageShell from "@/components/InfoPageShell"

export const metadata: Metadata = {
  title: "FAQ | Bats Club",
  description:
    "Frequently asked questions about Bats Club — shipping, orders, returns and contact information.",
}

const FAQ: { q: string; a: string }[] = [
  {
    q: "What is Bats Club?",
    a: "Bats Club is a private anime figure archive and marketplace. All figures come from a single collector's personal collection of 2000+ authentic Japanese originals from the 1990s–2000s.",
  },
  {
    q: "How does shipping work?",
    a: "We ship worldwide to supported regions. Average delivery time is 21 days with tracking. Shipping cost: Russia $9, Europe $17, USA & Canada $20, Asia $17, Rest of World $22.",
  },
  {
    q: "Which regions do you ship to?",
    a: "We ship to Europe, Russia, USA & Canada, Australia, New Zealand, Israel, UAE, Saudi Arabia, Turkey and Japan. We currently do not ship to Africa, China, Hong Kong, Macau and Thailand.",
  },
  {
    q: "How do I place an order?",
    a: "Browse the archive, add figures to cart, proceed to checkout. We accept all major credit cards, Apple Pay and Google Pay.",
  },
  {
    q: "What condition are the figures in?",
    a: "Each figure is carefully inspected and condition is listed on every page: Mint, Near Mint, Good, Fair or Poor.",
  },
  {
    q: "What is your return policy?",
    a: "If your order arrives damaged, contact us within 14 days of receiving your package at support@batsclub.com with photos of the damage.",
  },
  {
    q: "How do I contact support?",
    a: "Email us at support@batsclub.com",
  },
]

export default function FaqPage() {
  return (
    <InfoPageShell
      title="FAQ"
      subtitle="Frequently asked questions about Bats Club."
    >
      <div className="space-y-8">
        {FAQ.map(({ q, a }) => (
          <div key={q}>
            <h2 className="text-white font-bold text-base mb-2">{q}</h2>
            <p className="text-white/60 text-sm leading-relaxed">{a}</p>
          </div>
        ))}
      </div>
    </InfoPageShell>
  )
}
