import { Metadata } from "next"
import InfoPageShell from "@/components/InfoPageShell"

export const metadata: Metadata = {
  title: "Terms of Service | Bats Club",
  description:
    "Bats Club terms of service. Operated by Sinbiox Limited, Hong Kong.",
}

export default function TermsPage() {
  return (
    <InfoPageShell title="Terms of Service">
      <section>
        <p className="text-white/70 text-sm leading-relaxed">
          Bats Club is operated by <span className="text-white font-semibold">Sinbiox Limited</span>, Hong Kong. By placing an order you agree to the terms below.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Authenticity</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          All figures are authentic original Japanese releases from a single private collection. No reproductions, bootlegs, or third-party resales.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Orders &amp; Returns</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          All sales are final. If your order arrives damaged, contact{" "}
          <a href="mailto:support@batsclub.com" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            support@batsclub.com
          </a>{" "}
          within 14 days of receiving your package with photos of the damage.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Shipping</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          We ship to supported regions only — see the <a href="/faq" className="text-[#ff2d78] hover:opacity-80 transition-opacity">FAQ</a> for the full list. Orders to unsupported regions cannot be fulfilled.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Payments &amp; Currency</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Payments are processed securely by Stripe in US dollars. Prices are shown in USD; approximate local currency equivalents (when displayed) are for reference only and may differ slightly from the final amount charged by your bank or card network.
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
    </InfoPageShell>
  )
}
