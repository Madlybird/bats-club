import { Metadata } from "next"
import InfoPageShell from "@/components/InfoPageShell"

export const metadata: Metadata = {
  title: "利用規約 | Bats Club",
  description:
    "Bats Club 利用規約。運営：Sinbiox Limited。",
}

export default function TermsJpPage() {
  return (
    <InfoPageShell title="利用規約">
      <section>
        <p className="text-white/70 text-sm leading-relaxed">
          Bats Clubは <span className="text-white font-semibold">Sinbiox Limited</span>によって運営されています。ご注文いただくことで、以下の規約に同意したものとみなします。
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">真正性について</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          すべてのフィギュアは、1人のコレクターが所有する私設コレクションからの日本正規版オリジナル品です。複製品、ブートレッグ、第三者の転売品は一切取り扱いません。
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">注文・返品について</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          すべての販売は最終販売です。商品が破損した状態で届いた場合は、荷物の受け取りから14日以内に、破損箇所の写真を添えて{" "}
          <a href="mailto:support@batsclub.com" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            support@batsclub.com
          </a>{" "}
          までご連絡ください。
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">配送</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          対応地域へのみ発送しております。対応地域の一覧は <a href="/jp/faq" className="text-[#ff2d78] hover:opacity-80 transition-opacity">FAQ</a> をご覧ください。対応外地域へのご注文はお受けできません。
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">支払いと通貨</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          お支払いはStripeにより米ドルで安全に処理されます。価格は米ドル建てで表示されます。参考として表示される現地通貨の概算額は目安であり、実際の請求額はご利用の銀行・カードネットワークにより若干異なる場合があります。
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">お問い合わせ</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          規約に関するお問い合わせは{" "}
          <a href="mailto:support@batsclub.com" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            support@batsclub.com
          </a>{" "}
          までご連絡ください。
        </p>
      </section>
    </InfoPageShell>
  )
}
