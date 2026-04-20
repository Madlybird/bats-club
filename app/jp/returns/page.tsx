import { Metadata } from "next"
import InfoPageShell from "@/components/InfoPageShell"

export const metadata: Metadata = {
  title: "返品ポリシー | Bats Club",
  description:
    "Bats Club 返品ポリシー。配送中に破損したフィギュアについては、受け取りから14日以内に返品を承ります。運営：SINBIOX Limited。",
}

export default function ReturnsJpPage() {
  return (
    <InfoPageShell title="返品ポリシー">
      <section>
        <p className="text-white/70 text-sm leading-relaxed">
          Bats Clubは <span className="text-white font-semibold">SINBIOX Limited</span>によって運営されています。本ポリシーでは、返品をお受けする条件と手順について説明します。
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">返品受付期間</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          荷物を受け取った日から14日以内に返品をお申し込みください。
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">返品を承る場合</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          配送中に破損したフィギュアのみ返品を承ります。
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">返品をお受けできない場合</h2>
        <ul className="text-white/60 text-sm leading-relaxed list-disc pl-5 space-y-1">
          <li>商品ページに記載された状態を理由とする返品</li>
          <li>受け取りから14日を過ぎた返品のお申し込み</li>
          <li>交換</li>
        </ul>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">返品の申請方法</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          注文番号、破損箇所が明確にわかる写真、簡単な説明を添えて{" "}
          <a href="mailto:support@batsclub.com" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            support@batsclub.com
          </a>{" "}
          までメールでご連絡ください。2営業日以内にご返信いたします。
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">返送料</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          承認された返品については、返送料は当社が負担いたします。
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">返金</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          返金はご購入時のお支払い方法に対して、5〜10営業日以内に処理されます。発送前にキャンセルされた場合を除き、送料は返金対象外です。
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">返品手数料</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          返品手数料はいただきません。
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">お問い合わせ</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          ご質問は{" "}
          <a href="mailto:support@batsclub.com" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            support@batsclub.com
          </a>{" "}
          までご連絡ください。
        </p>
      </section>
    </InfoPageShell>
  )
}
