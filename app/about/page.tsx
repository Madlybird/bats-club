import { Metadata } from "next"
import InfoPageShell from "@/components/InfoPageShell"

export const metadata: Metadata = {
  title: "About",
  description:
    "Bats Club is a public archive and studio run by SINBIOX, an artist and collector. Not an open marketplace.",
  alternates: {
    canonical: "https://batsclub.com/about",
    languages: {
      en: "https://batsclub.com/about",
      ru: "https://batsclub.com/ru/about",
      ja: "https://batsclub.com/jp/about",
      "x-default": "https://batsclub.com/about",
    },
  },
}

export default function AboutPage() {
  return (
    <InfoPageShell title="About Bats Club">
      <section>
        <p className="text-white/70 text-sm leading-relaxed">
          Bats Club is a public archive and studio, run by SINBIOX, an artist and collector. What started as a private collection of rare anime figures now includes original art, artbooks, and collectible cards: everything found, kept, or made by the same person.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">What is the Archive</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          The Archive is the full catalog: every figure the collection has documented, currently for sale or kept for reference, with books and cards from the same collection joining soon. It includes photos, condition notes, series and character details for pieces that are genuinely rare, many discontinued 15 to 25 years ago. Browsing the Archive means browsing collecting history.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">What is the Studio</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          The Studio is original art by SINBIOX: posters, prints, postcards, and zines, made rather than collected. It sits next to the Archive, not inside it. One person, two ways of adding to the world.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Not a marketplace</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Bats Club is not an open marketplace. Every figure in the Shop is sold directly by SINBIOX, who built the archive, under the terms set out in our{" "}
          <a href="/terms" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            Terms of Service
          </a>
          . There are no other sellers, no consignment, and no outside listings. The Shop only shows what's currently for sale from this one collection.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">How the Shop works</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          When a figure from the collection is ready to sell, it gets listed with its condition graded (Mint, Near Mint, Good, Fair, or Poor) and its own original photos, taken by SINBIOX. Each listing is a single, unique piece. Once it sells, it moves into the Archive as sold and stays there as a record. Art, books, and cards each have their own condition and shipping terms, covered in their own sections. If a package arrives damaged, our{" "}
          <a href="/returns" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            Returns Policy
          </a>{" "}
          covers the process.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Why this collection</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Five years of sourcing means the selection skews toward the rare end: figures that stopped production decades ago, limited runs, pieces that rarely surface even on resale platforms. The Archive is built for depth, documenting and eventually placing pieces that matter to collectors, keeping them in circulation.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Who runs Bats Club</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Bats Club is operated by SINBIOX Limited, registered in Hong Kong. Payments are processed securely through Stripe.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Contact</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Questions about a figure, an order, or the collection itself? Email{" "}
          <a href="mailto:support@batsclub.com" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            support@batsclub.com
          </a>
          . We respond within 2 business days.
        </p>
      </section>
    </InfoPageShell>
  )
}
