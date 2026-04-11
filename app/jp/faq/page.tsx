import { Metadata } from "next"
import InfoPageShell from "@/components/InfoPageShell"

export const metadata: Metadata = {
  title: "FAQ | Bats Club",
  description:
    "Bats Clubに関するよくあるご質問 — 配送、注文、返品、お問い合わせについて。",
}

const FAQ: { q: string; a: string }[] = [
  {
    q: "Bats Clubとは？",
    a: "Bats Clubは、プライベートなアニメフィギュアのアーカイブ兼マーケットプレイスです。すべてのフィギュアは、1人のコレクターが所有する1990年代〜2000年代の正規日本版2000点以上の個人コレクションから出品されています。",
  },
  {
    q: "配送はどのように行われますか？",
    a: "対応地域へ世界中に発送しています。平均配送期間は21日で、追跡番号付きです。送料：ロシア $9、ヨーロッパ $17、米国・カナダ $20、アジア $17、その他の地域 $22。",
  },
  {
    q: "配送対応地域は？",
    a: "ヨーロッパ、ロシア、米国・カナダ、オーストラリア、ニュージーランド、イスラエル、UAE、サウジアラビア、トルコ、日本に発送しています。現在、アフリカ、中国、香港、マカオ、タイへの発送は行っておりません。",
  },
  {
    q: "注文方法は？",
    a: "アーカイブを閲覧し、フィギュアをカートに追加してチェックアウトに進んでください。主要なクレジットカード、Apple Pay、Google Payに対応しています。",
  },
  {
    q: "フィギュアの状態は？",
    a: "各フィギュアは丁寧に検品され、状態は各ページに表記されています：Mint（新品同様）、Near Mint（ほぼ新品）、Good（良好）、Fair（普通）、Poor（悪い）。",
  },
  {
    q: "返品ポリシーは？",
    a: "商品が破損した状態で届いた場合は、荷物の受け取りから14日以内に、破損箇所の写真を添えて support@batsclub.com までご連絡ください。",
  },
  {
    q: "サポートへの連絡方法は？",
    a: "support@batsclub.com までメールでご連絡ください。",
  },
]

export default function FaqJpPage() {
  return (
    <InfoPageShell
      title="FAQ"
      subtitle="Bats Clubに関するよくあるご質問。"
    >
      <div className="space-y-8">
        {FAQ.map(({ q, a }) => (
          <div key={q}>
            <h2 className="text-white font-bold text-base mb-2">{q}</h2>
            <p className="text-white/60 text-sm leading-relaxed">{a}</p>
          </div>
        ))}
      </div>
    </InfoPageShell>
  )
}
