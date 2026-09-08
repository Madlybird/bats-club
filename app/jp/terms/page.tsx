import { Metadata } from "next"
import InfoPageShell from "@/components/InfoPageShell"

export const metadata: Metadata = {
  title: "利用規約",
  description:
    "Bats Club 利用規約。運営：SINBIOX Limited。",
  alternates: {
    canonical: "https://batsclub.com/jp/terms",
    languages: {
      en: "https://batsclub.com/terms",
      ru: "https://batsclub.com/ru/terms",
      ja: "https://batsclub.com/jp/terms",
      "x-default": "https://batsclub.com/terms",
    },
  },
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
        <h2 className="text-white font-bold text-base mb-2">アート</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          アートセクションでは、SINBIOX が制作したオリジナル作品（ポスター、プリント、ポストカード、ステッカー、キャンバス、zine）を新品として販売しています。
        </p>
        <ul className="text-white/60 text-sm leading-relaxed list-disc pl-5 space-y-2 mt-3">
          <li><span className="text-white font-semibold">状態。</span> すべてのアートは新品として販売されます。印刷物における色・裁断・仕上げのわずかな違いは素材の特性であり、不良品ではありません。</li>
          <li><span className="text-white font-semibold">在庫と価格。</span> 在庫はリアルタイムで表示されます。価格は米ドル建てで、ご注文時点で確定します。</li>
          <li><span className="text-white font-semibold">配送。</span> アートは対応地域へ追跡番号付きで発送されます。配送予定期間は14〜28営業日です。対応外地域へのご注文は全額返金いたします。</li>
          <li><span className="text-white font-semibold">関税・輸入税。</span> 国際注文には、お届け先の国の関税・輸入税が課される場合があり、これらは受取人の負担となります。未払いの関税により荷物が返送された場合、元の送料は返金されません。</li>
          <li><span className="text-white font-semibold">年齢制限のある作品。</span> 一部の作品には芸術的なヌードや示唆的なテーマが含まれ、18+ と表示されています。表示のある作品を購入することで、お客様がご自身の国・地域の法律上の成人であることを確認したものとみなします。</li>
          <li><span className="text-white font-semibold">知的財産。</span> 作品の購入により移転するのは、その物理的な現物1点の所有権のみです。作品およびその画像に関する著作権、著作者人格権その他の知的財産権はすべて SINBIOX が保有します。購入した作品の全部または一部を、複製・コピー・スキャン・配布目的での撮影・印刷・出版・頒布・複製品の販売・公のまたは商業的な展示すること、および二次的著作物を作成することはできません。作品に関するライセンスは付与されません。作品を改変したり、著作者の意図を誤認させる方法で提示したりしてはなりません。</li>
          <li><span className="text-white font-semibold">返品。</span> 返品は、配送中の破損または製造上の欠陥がある場合に限り、受け取りから14日以内に、開封動画を添えて承ります。お客様都合の返品および交換はお受けできません。デジタルダウンロードは、ダウンロードリンクの発行後は返金対象外です。</li>
          <li><span className="text-white font-semibold">デジタルダウンロード。</span> デジタル購入は PDF ファイルで、支払い後にメールで送付されるダウンロードリンク（7日間有効）でお渡しします。ご自身での印刷を含む個人利用が可能ですが、ファイルの再販・再配布・商用利用はできません。</li>
          <li><span className="text-white font-semibold">支払いと準拠法。</span> お支払いは Stripe により米ドルで処理されます。本規約は香港特別行政区の法律に準拠します。</li>
        </ul>
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
