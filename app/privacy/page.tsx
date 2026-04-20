import { Metadata } from "next"
import InfoPageShell from "@/components/InfoPageShell"

export const metadata: Metadata = {
  title: "Privacy Policy | Bats Club",
  description:
    "How Bats Club handles your personal data. Operated by SINBIOX Limited.",
}

export default function PrivacyPage() {
  return (
    <InfoPageShell title="Privacy Policy">
      <section>
        <p className="text-white/40 text-xs leading-relaxed">Last updated: April 2026</p>
      </section>

      <section>
        <p className="text-white/70 text-sm leading-relaxed">
          Bats Club is operated by <span className="text-white font-semibold">SINBIOX Limited</span>. This policy explains what data we collect, how we use it, and your rights.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">1. What we collect</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          We collect your name, email address, shipping address, phone number, order history, and wishlist. Payment information is processed by Stripe and is never stored on our servers. We also collect basic analytics such as browser, device, and pages visited.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">2. How we use your data</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          We use your data to process orders, send shipping updates and order confirmations, notify you about wishlist availability, provide customer support, and improve the site. We do not sell your data.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">3. Who we share with</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          We share data with Stripe (payment processing), shipping carriers (delivery), our email provider (order and shipping notifications), and Google Analytics (anonymized usage data). All third parties are bound by data protection agreements.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">4. Data retention</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Account and order data are retained while your account is active, plus 7 years after closure for tax and accounting compliance.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">5. Your rights</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          You have the right to access, correct, delete, restrict, or port your data, and to withdraw consent at any time. EEA residents have additional rights under the GDPR. California residents have rights under the CCPA. We do not sell personal information. To exercise any of these rights, contact{" "}
          <a href="mailto:support@batsclub.com" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            support@batsclub.com
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">6. Data security</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          We use HTTPS, Stripe for payments, and internal access controls to protect your data. No method of transmission or storage is 100% secure.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">7. Children's privacy</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Bats Club is intended for users aged 18 and over. We do not knowingly collect data from minors. If you believe a minor has submitted data, contact{" "}
          <a href="mailto:support@batsclub.com" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            support@batsclub.com
          </a>{" "}
          and we will remove it.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">8. Changes to this policy</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          We may update this policy from time to time. Material changes will be announced via email. The current version is always available at{" "}
          <a href="/privacy" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            batsclub.com/privacy
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">9. Contact</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Contact{" "}
          <a href="mailto:support@batsclub.com" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            support@batsclub.com
          </a>
          . Bats Club is operated by SINBIOX Limited.
        </p>
      </section>
    </InfoPageShell>
  )
}
