import { Metadata } from "next"
import InfoPageShell from "@/components/InfoPageShell"

export const metadata: Metadata = {
  title: "Terms of Service | Bats Club",
  description:
    "Bats Club terms of service. Operated by SINBIOX Limited.",
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
