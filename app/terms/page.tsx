import { Metadata } from "next"
import InfoPageShell from "@/components/InfoPageShell"

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Bats Club terms of service. Operated by SINBIOX Limited.",
  alternates: {
    canonical: "https://batsclub.com/terms",
    languages: {
      en: "https://batsclub.com/terms",
      ru: "https://batsclub.com/ru/terms",
      ja: "https://batsclub.com/jp/terms",
      "x-default": "https://batsclub.com/terms",
    },
  },
}

export default function TermsPage() {
  return (
    <InfoPageShell title="Terms of Service">
      <section>
        <p className="text-white/70 text-sm leading-relaxed">
          Bats Club is operated by <span className="text-white font-semibold">SINBIOX Limited</span>. By placing an order you agree to the terms below.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Authenticity</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          All figures are authentic original Japanese releases from a single private collection. No reproductions, bootlegs, or third-party resales.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Shipping</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          We ship to supported regions only. Orders are limited to a maximum of 3 figures per order. Rates vary by destination and quantity — see the <a href="/faq" className="text-[#ff2d78] hover:opacity-80 transition-opacity">FAQ</a> for the full breakdown. Estimated delivery is 14–28 business days with tracking. Orders to unsupported regions will be refunded in full.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Customs and Import Taxes</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          International orders may be subject to customs duties, import taxes, and fees imposed by the destination country. These charges are the sole responsibility of the recipient. Bats Club has no control over these charges and cannot predict their amount. By placing an order, you accept responsibility for any applicable customs fees. If a package is refused due to unpaid customs fees and returned to us, the original shipping cost will not be refunded.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Orders &amp; Returns</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          All figures are single unique pieces. Once placed, orders cannot be modified. Returns are accepted only for figures damaged in transit within 14 days of delivery — see our <a href="/returns" className="text-[#ff2d78] hover:opacity-80 transition-opacity">Returns Policy</a>.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Art</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          The Art section sells original works created by SINBIOX — posters, prints, postcards, stickers, canvas and zines, produced by the artist and sold as new.
        </p>
        <ul className="text-white/60 text-sm leading-relaxed list-disc pl-5 space-y-2 mt-3">
          <li><span className="text-white font-semibold">Condition.</span> All art is sold as new. Minor variation in colour, trim or finish on printed items is inherent to the medium and is not a defect.</li>
          <li><span className="text-white font-semibold">Availability &amp; pricing.</span> Availability is shown in real time. Prices are in USD and locked in at the moment the order is placed.</li>
          <li><span className="text-white font-semibold">Shipping.</span> Art ships to supported regions with tracking. Estimated delivery is 14–28 working days. Orders to unsupported regions are refunded in full.</li>
          <li><span className="text-white font-semibold">Customs &amp; import taxes.</span> International orders may be subject to customs duties and import taxes charged by the destination country; these are the recipient&apos;s responsibility. If a package is refused over unpaid customs fees and returned to us, the original shipping cost is not refunded.</li>
          <li><span className="text-white font-semibold">Age-restricted works.</span> Some art depicts artistic nudity or suggestive themes and is labelled 18+. By purchasing a labelled item you confirm you are of legal age in your jurisdiction.</li>
          <li><span className="text-white font-semibold">Intellectual property.</span> Purchase of a work transfers ownership of that single physical copy only. SINBIOX retains all copyright, moral rights and other intellectual-property rights in the artwork and its image. You may not reproduce, copy, scan, photograph for distribution, print, publish, distribute, sell reproductions of, publicly or commercially display, or create derivative works from any purchased work, in whole or in part. No licence to the artwork is granted. The work must not be altered or presented in a way that misrepresents the artist.</li>
          <li><span className="text-white font-semibold">Returns.</span> Returns are accepted only for transit damage or a manufacturing defect, within 14 days of delivery, with an unboxing video. Change-of-mind returns and exchanges are not accepted.</li>
          <li><span className="text-white font-semibold">Payments &amp; governing law.</span> Payments are processed by Stripe in USD. These terms are governed by the laws of the Hong Kong SAR.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Product Condition</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Each figure is pre-owned and comes from a private 1990s–2000s Japanese collection. The condition is disclosed on every product page: Mint, Near Mint, Good, Fair or Poor. By placing an order you accept the stated condition.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Order Limits</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          A maximum of 3 figures per order applies. If you'd like more than 3, please place separate orders or contact{" "}
          <a href="mailto:support@batsclub.com" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            support@batsclub.com
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Pricing and Availability</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          All prices are in USD and may change without notice. The price is locked in at the moment the order is placed. Availability is real-time — once a figure is sold, it is permanently removed from the store. We reserve the right to cancel orders in the case of pricing errors, in which case a full refund will be issued.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Payments &amp; Currency</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Payments are processed securely by Stripe in US dollars. Prices are shown in USD; approximate local currency equivalents (when displayed) are for reference only and may differ slightly from the final amount charged by your bank or card network.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Governing Law</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          These terms are governed by the laws of the Hong Kong Special Administrative Region. Any disputes will be resolved in Hong Kong jurisdiction.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Updates to these Terms</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          We may update these terms at any time. The current version is always available at{" "}
          <a href="/terms" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            batsclub.com/terms
          </a>
          . Continued use of the site constitutes acceptance of the updated terms.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Contact</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Questions about these terms? Email{" "}
          <a href="mailto:support@batsclub.com" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            support@batsclub.com
          </a>
          .
        </p>
      </section>

      <section>
        <p className="text-white/40 text-xs leading-relaxed">Last updated: April 2026</p>
      </section>
    </InfoPageShell>
  )
}
