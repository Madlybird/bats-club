import { Metadata } from "next"
import InfoPageShell from "@/components/InfoPageShell"

export const metadata: Metadata = {
  title: "Privacy Policy | Bats Club",
  description:
    "How Bats Club handles your personal data. Operated by Sinbiox Limited, Hong Kong.",
}

export default function PrivacyPage() {
  return (
    <InfoPageShell title="Privacy Policy">
      <section>
        <p className="text-white/70 text-sm leading-relaxed">
          Bats Club is operated by <span className="text-white font-semibold">Sinbiox Limited</span>, Hong Kong. This policy explains what data we collect and how we use it.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">What we collect</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          We collect your name, email address and shipping address for order processing. Payment data is processed by Stripe and is never stored on our servers.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">How we use your data</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          We use your data to process orders, send you shipping updates, and notify you when figures on your wishlist become available.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Third parties</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          We use the following third-party services to operate the site: <span className="text-white">Stripe</span> (payments), <span className="text-white">Supabase</span> (database &amp; storage) and <span className="text-white">Vercel</span> (hosting). We do not sell your data to anyone.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Account deletion</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          To request account deletion, contact{" "}
          <a href="mailto:support@batsclub.com" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            support@batsclub.com
          </a>
          .
        </p>
      </section>
    </InfoPageShell>
  )
}
