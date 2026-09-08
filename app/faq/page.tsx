import { Metadata } from "next"
import InfoPageShell from "@/components/InfoPageShell"

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about Bats Club — shipping, orders, returns and contact information.",
  alternates: {
    canonical: "https://batsclub.com/faq",
    languages: {
      en: "https://batsclub.com/faq",
      ru: "https://batsclub.com/ru/faq",
      ja: "https://batsclub.com/jp/faq",
      "x-default": "https://batsclub.com/faq",
    },
  },
}

const FAQ: { q: string; a: string }[] = [
  {
    q: "What is Bats Club?",
    a: "Bats Club is a private anime figure archive and shop, not an open marketplace. All figures come from a single collector's personal collection of 10,000+ authentic Japanese originals from the 1990s–2000s, sold directly by that collector.",
  },
  {
    q: "How does shipping work?",
    a: "We ship worldwide to supported regions with tracking. Average delivery time is 21 business days (14–28 day window). Maximum 3 figures per order. Shipping rates (per order) — Russia: $9 for 1 figure / $14 for 2 / $22 for 3. Europe: $12 for 1 figure / $18 for 2 / $26 for 3. USA & Canada: $12 for 1 figure / $18 for 2 / $26 for 3. Asia (Japan): $17 for 1 figure / $26 for 2 / $42 for 3. Rest of World: $15 for 1 figure / $20 for 2 / $30 for 3. All orders ship within 1–3 business days of payment confirmation.",
  },
  {
    q: "Which regions do you ship to?",
    a: "We ship to Europe, Russia, USA, Canada, Australia, New Zealand and Japan. We do not ship to Africa, China, Hong Kong, Macau, Thailand, Israel, UAE, Saudi Arabia and Turkey.",
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
  {
    q: "What is the Art section?",
    a: "The Art section offers original works by SINBIOX — posters, prints, postcards, stickers, canvas and zines. Every piece is made by the artist and sold as new.",
  },
  {
    q: "How does shipping work for art?",
    a: "We ship worldwide with tracking to Europe, Russia, the USA, Canada, Australia, New Zealand and Japan. We do not ship to Africa, China, Hong Kong, Macau, Thailand, Israel, the UAE, Saudi Arabia or Turkey. Estimated delivery is 14–28 working days. Orders ship within 1–3 business days of payment. Rates per order — Russia: $9 / $14 / $22. Europe: $12 / $18 / $26. USA & Canada: $12 / $18 / $26. Japan: $17 / $26 / $42. Rest of the world: $15 / $20 / $30.",
  },
  {
    q: "What condition is the art in?",
    a: "All art is sold as new, direct from the artist. Minor variation in colour, trim or finish on printed items is inherent to the medium and is not a defect.",
  },
  {
    q: "Can I return art?",
    a: "Returns are accepted only for items damaged in transit or with a manufacturing defect, within 14 days of delivery, with photos and an unboxing video. Change-of-mind returns are not accepted. See the Returns Policy.",
  },
  {
    q: "Is any art age-restricted?",
    a: "Some works contain artistic nudity or suggestive themes and are labelled 18+. By purchasing a labelled item you confirm you are of legal age in your jurisdiction.",
  },
  {
    q: "Do I get the rights to the artwork when I buy it?",
    a: "No. You own the physical piece you purchased. SINBIOX retains all copyright and other intellectual-property rights in the artwork and its image. You may not reproduce, scan, print, distribute, sell copies of, commercially use or publicly display the work, or make derivative works from it.",
  },
]

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
}

export default function FaqPage() {
  return (
    <InfoPageShell
      title="FAQ"
      subtitle="Frequently asked questions about Bats Club."
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }}
      />
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
