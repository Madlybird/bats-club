import { Metadata } from "next"
import InfoPageShell from "@/components/InfoPageShell"

export const metadata: Metadata = {
  title: "プライバシーポリシー | Bats Club",
  description:
    "Bats Clubにおける個人情報の取り扱いについて。運営：Sinbiox Limited。",
}

export default function PrivacyJpPage() {
  return (
    <InfoPageShell title="プライバシーポリシー">
      <section>
        <p className="text-white/70 text-sm leading-relaxed">
          Bats Clubは <span className="text-white font-semibold">Sinbiox Limited</span>によって運営されています。本ポリシーでは、当社が収集するデータとその利用方法について説明します。
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">収集する情報</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          注文処理のために、お名前、メールアドレス、配送先住所を収集します。お支払い情報はStripeによって処理され、当社のサーバーには一切保存されません。
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">情報の利用目的</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          ご注文の処理、配送状況のお知らせ、ウィッシュリストに登録されたフィギュアが入荷した際の通知のためにのみ利用します。
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">アカウントの削除</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          アカウントの削除をご希望の場合は{" "}
          <a href="mailto:support@batsclub.com" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            support@batsclub.com
          </a>{" "}
          までご連絡ください。
        </p>
      </section>
    </InfoPageShell>
  )
}
