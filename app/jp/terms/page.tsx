import { Metadata } from "next"
import InfoPageShell from "@/components/InfoPageShell"

export const metadata: Metadata = {
  title: "利用規約 | Bats Club",
  description:
    "Bats Club 利用規約。運営：SINBIOX Limited。",
}

export default function TermsJpPage() {
  return (
    <InfoPageShell title="利用規約">
      <section>
        <p className="text-white/70 text-sm leading-relaxed">
          Bats Clubは <span className="text-white font-semibold">SINBIOX Limited</span>によって運営されています。ご注文いただくことで、以下の規約に同意したものとみなします。
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">真正性について</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          すべてのフィギュアは、1人のコレクターが所有する私設コレクションからの日本正規版オリジナル品です。複製品、ブートレッグ、第三者の転売品は一切取り扱いません。
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">配送</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          対応地域へのみ発送しております。1注文につき最大3点までのフィギュアをお送りできます。送料は配送先と数量によって異なります — 詳細は <a href="/jp/faq" className="text-[#ff2d78] hover:opacity-80 transition-opacity">FAQ</a> をご覧ください。配送予定期間は追跡番号付きで14〜28営業日です。対応外地域へのご注文は全額返金いたします。
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">関税・輸入税について</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          国際注文には、お届け先の国の関税・輸入税・手数料が課される場合があります。これらの費用はすべて受取人の負担となります。Bats Clubはこれらの費用を管理することができず、金額を事前に予測することもできません。ご注文いただくことで、関税費用に関する責任を受け入れたものとみなします。未払いの関税により荷物が返送された場合、元の送料は返金されません。
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">注文・返品について</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          すべてのフィギュアは一点物です。ご注文後の内容変更は承っておりません。返品は配送中に破損したフィギュアに限り、受け取りから14日以内に承ります — <a href="/jp/returns" className="text-[#ff2d78] hover:opacity-80 transition-opacity">返品ポリシー</a>をご覧ください。
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">商品の状態について</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          各フィギュアは中古品であり、1990〜2000年代の日本の個人コレクションからのものです。状態は各商品ページに記載されています：Mint（新品同様）、Near Mint（ほぼ新品）、Good（良好）、Fair（普通）、Poor（悪い）。ご注文いただくことで、記載された状態をご承諾いただいたものとみなします。
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">注文数の上限</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          1注文につき最大3点までとさせていただきます。3点を超えるご注文をご希望の場合は、注文を分けていただくか、{" "}
          <a href="mailto:support@batsclub.com" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            support@batsclub.com
          </a>
          {" "}までご連絡ください。
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">価格と在庫</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          すべての価格は米ドル建てであり、予告なく変更される場合があります。価格はご注文時点で確定します。在庫はリアルタイムで更新され、販売済みのフィギュアはストアから完全に削除されます。価格表示の誤りがあった場合は、当社の判断でご注文をキャンセルし、全額返金する権利を留保いたします。
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">支払いと通貨</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          お支払いはStripeにより米ドルで安全に処理されます。価格は米ドル建てで表示されます。参考として表示される現地通貨の概算額は目安であり、実際の請求額はご利用の銀行・カードネットワークにより若干異なる場合があります。
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">準拠法</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          本規約は香港特別行政区の法律に準拠します。紛争は香港の管轄において解決されます。
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">規約の更新</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          当社は本規約をいつでも更新できるものとします。最新版は常に{" "}
          <a href="/jp/terms" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            batsclub.com/terms
          </a>
          {" "}でご確認いただけます。サイトの継続的な利用は、更新後の規約への同意とみなされます。
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">お問い合わせ</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          規約に関するお問い合わせは{" "}
          <a href="mailto:support@batsclub.com" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            support@batsclub.com
          </a>
          {" "}までご連絡ください。
        </p>
      </section>

      <section>
        <p className="text-white/40 text-xs leading-relaxed">最終更新：2026年4月</p>
      </section>
    </InfoPageShell>
  )
}
