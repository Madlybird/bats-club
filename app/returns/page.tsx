import { Metadata } from "next"
import InfoPageShell from "@/components/InfoPageShell"

export const metadata: Metadata = {
  title: "Returns Policy | Bats Club",
  description:
    "Bats Club returns policy. Returns accepted for figures damaged in transit within 14 days. Operated by SINBIOX Limited.",
}

export default function ReturnsPage() {
  return (
    <InfoPageShell title="Returns Policy">
      <section>
        <p className="text-white/70 text-sm leading-relaxed">
          Bats Club is operated by <span className="text-white font-semibold">SINBIOX Limited</span>. This policy explains when and how you can request a return.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Return window</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          You have 14 days from receiving your package to request a return.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">What we accept</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          We accept returns only for figures damaged in transit.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">What we do not accept</h2>
        <ul className="text-white/60 text-sm leading-relaxed list-disc pl-5 space-y-1">
          <li>Returns for the condition as stated on the product page</li>
          <li>Returns requested after 14 days from delivery</li>
          <li>Exchanges</li>
        </ul>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">How to request a return</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Email{" "}
          <a href="mailto:support@batsclub.com" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            support@batsclub.com
          </a>{" "}
          with your order number, clear photos of the damage, and a short description. We respond within 2 business days.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Unboxing Video Requirement</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          To protect both parties in case of transit damage, we require buyers to record an unboxing video. The video must be:
        </p>
        <ul className="text-white/60 text-sm leading-relaxed list-disc pl-5 space-y-1 mt-2">
          <li>Continuous and unedited (single take, no cuts)</li>
          <li>Clearly showing the shipping label with your address before opening</li>
          <li>Showing the full unpacking process from sealed box to contents</li>
        </ul>
        <p className="text-white/60 text-sm leading-relaxed mt-3">
          Returns for transit damage will only be accepted if accompanied by an unboxing video meeting these requirements. This is standard practice among vintage collectible sellers and protects you as a buyer.
        </p>
        <p className="text-white/60 text-sm leading-relaxed mt-3">
          We also do not accept returns for:
        </p>
        <ul className="text-white/60 text-sm leading-relaxed list-disc pl-5 space-y-1 mt-2">
          <li>Condition issues clearly described in the listing or visible in product photos (scuffs, box wear, etc.)</li>
          <li>Age-related material changes such as plastic brittleness or material wear on vintage items (10-20+ years old)</li>
          <li>Sealed items (MISB) where factory seals have been broken by the buyer</li>
        </ul>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Return shipping</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          For approved returns, we cover return shipping costs.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Refunds</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Refunds are processed within 5–10 business days to your original payment method. Shipping costs are non-refundable unless the order is cancelled before shipment.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Restocking fees</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          We do not charge restocking fees.
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">Contact</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Questions? Email{" "}
          <a href="mailto:support@batsclub.com" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            support@batsclub.com
          </a>
          .
        </p>
      </section>
    </InfoPageShell>
  )
}
