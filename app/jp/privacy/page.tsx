import { Metadata } from "next"
import InfoPageShell from "@/components/InfoPageShell"

export const metadata: Metadata = {
  title: "プライバシーポリシー | Bats Club",
  description:
    "Bats Clubにおける個人情報の取り扱いについて。運営：SINBIOX Limited。",
}

export default function PrivacyJpPage() {
  return (
    <InfoPageShell title="プライバシーポリシー">
      <section>
        <p className="text-white/40 text-xs leading-relaxed">最終更新：2026年4月</p>
      </section>

      <section>
        <p className="text-white/70 text-sm leading-relaxed">
          Bats Clubは <span className="text-white font-semibold">SINBIOX Limited</span>によって運営されています。本ポリシーでは、当社が収集するデータ、その利用方法、およびお客様の権利について説明します。
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">1. 収集する情報</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          お名前、メールアドレス、配送先住所、電話番号、注文履歴、ウィッシュリストを収集します。お支払い情報はStripeによって処理され、当社のサーバーには一切保存されません。また、ブラウザ、デバイス、閲覧ページなどの基本的な分析データも収集します。
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">2. 情報の利用目的</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          ご注文の処理、配送状況および注文確認の通知、ウィッシュリストに登録されたフィギュアの入荷通知、カスタマーサポート、サイトの改善のために利用します。当社はお客様のデータを販売しません。
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">3. 第三者との共有</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Stripe（決済処理）、配送業者（配送）、メールプロバイダー（注文・配送通知）、Google Analytics（匿名化された利用状況データ）とデータを共有します。すべての第三者はデータ保護契約により拘束されています。
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">4. データの保存期間</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          アカウントおよび注文データは、アカウントがアクティブな間、および税務・会計コンプライアンスのために閉鎖後7年間保存されます。
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">5. お客様の権利</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          お客様には、アクセス、訂正、削除、制限、ポータビリティ、および同意の撤回の権利があります。EEA（欧州経済領域）居住者にはGDPRに基づく追加の権利があります。カリフォルニア州居住者にはCCPAに基づく権利があります。当社は個人情報を販売しません。これらの権利を行使するには{" "}
          <a href="mailto:support@batsclub.com" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            support@batsclub.com
          </a>
          {" "}までご連絡ください。
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">6. データのセキュリティ</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          当社はHTTPS、決済処理のStripe、内部アクセス制御を使用してお客様のデータを保護しています。ただし、100%安全な送信・保存方法は存在しません。
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">7. 児童のプライバシー</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Bats Clubは18歳以上の方を対象としています。当社は未成年者からデータを収集しません。未成年者がデータを送信したと思われる場合は{" "}
          <a href="mailto:support@batsclub.com" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            support@batsclub.com
          </a>
          {" "}までご連絡ください。速やかに削除いたします。
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">8. 本ポリシーの変更</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          本ポリシーは随時更新される場合があります。重要な変更はメールでお知らせします。最新版は常に{" "}
          <a href="/jp/privacy" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            batsclub.com/privacy
          </a>
          {" "}でご確認いただけます。
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">9. お問い合わせ</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          {" "}
          <a href="mailto:support@batsclub.com" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            support@batsclub.com
          </a>
          {" "}までご連絡ください。Bats ClubはSINBIOX Limitedによって運営されています。
        </p>
      </section>
    </InfoPageShell>
  )
}
