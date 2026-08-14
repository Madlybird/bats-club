import { Metadata } from "next"
import InfoPageShell from "@/components/InfoPageShell"

export const metadata: Metadata = {
  title: "私たちについて | Bats Club",
  description:
    "Bats Clubは、コレクター自身が直接販売するヴィンテージアニメフィギュアの私設アーカイブです。オープンなマーケットプレイスではありません。",
  alternates: {
    canonical: "https://batsclub.com/jp/about",
    languages: {
      en: "https://batsclub.com/about",
      ru: "https://batsclub.com/ru/about",
      ja: "https://batsclub.com/jp/about",
      "x-default": "https://batsclub.com/about",
    },
  },
}

export default function AboutJpPage() {
  return (
    <InfoPageShell title="Bats Clubについて">
      <section>
        <p className="text-white/70 text-sm leading-relaxed">
          Bats Clubは、ヴィンテージアニメフィギュアの私設アーカイブです。1990〜2000年代の日本正規版オリジナル品10,000点以上を、1人のコレクターが5年かけて集めました。アーカイブ内のすべてのフィギュアは、希少性・時代・状態を基準に一点一点選び抜かれています。すべてこの1つのコレクションから生まれたものです。
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">アーカイブとは</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          アーカイブは完全なカタログです。現在販売中かどうかにかかわらず、コレクションが記録してきたすべてのフィギュアが含まれます。写真、状態のメモ、シリーズやキャラクターの詳細が、15〜25年前に生産終了となったような本当に希少な品々について記録されています。アーカイブを見ることは、コレクションの歴史をたどることでもあります。
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">マーケットプレイスではありません</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Bats Clubはオープンなマーケットプレイスではありません。ショップ内のすべてのフィギュアは、アーカイブを築いたコレクター本人が、当社の{" "}
          <a href="/jp/terms" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            利用規約
          </a>
          {" "}に基づいて直接販売しています。他の出品者や委託販売、外部出品は一切ありません。ショップに表示されるのは、この1つのコレクションから現在販売中のものだけです。
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">ショップの仕組み</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          コレクションの中のフィギュアが販売できる状態になると、状態の評価（Mint、Near Mint、Good、Fair、Poor）とコレクター自身が撮影したオリジナル写真とともに出品されます。各出品は一点物です。販売後はアーカイブに「販売済み」として記録され、そのまま記録として残ります。配送中に破損があった場合の対応は{" "}
          <a href="/jp/returns" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            返品ポリシー
          </a>
          {" "}をご覧ください。
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">このコレクションについて</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          5年にわたる収集の結果、ラインナップは希少なものに偏っています。数十年前に生産が終了したフィギュア、限定生産品、再販市場でもめったに見かけない品々です。アーカイブは量ではなく深さを重視して作られており、コレクターにとって価値のある品々を記録し、いずれ引き継いでいくことで、それらを流通の中に残すことを目指しています。
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">運営会社について</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          Bats Clubは、香港に登記されたSINBIOX Limitedによって運営されています。お支払いはStripeにより安全に処理されます。
        </p>
      </section>

      <section>
        <h2 className="text-white font-bold text-base mb-2">お問い合わせ</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          フィギュア、ご注文、コレクションそのものについてのご質問は{" "}
          <a href="mailto:support@batsclub.com" className="text-[#ff2d78] hover:opacity-80 transition-opacity">
            support@batsclub.com
          </a>
          {" "}までご連絡ください。2営業日以内にご返信いたします。
        </p>
      </section>
    </InfoPageShell>
  )
}
