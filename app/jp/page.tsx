import type { Metadata } from "next"
import HomePageContent from "@/components/HomePageContent"
import { getHomeCollections } from "@/lib/collections"
import { jp } from "@/lib/dict"

export const metadata: Metadata = {
  title: "Bats Club — レアアニメフィギュアのアーカイブ＆マーケットプレイス",
  description:
    "プライベートコレクターによる本物のレアアニメフィギュア。1990〜2000年代の日本オリジナル品。デジ・キャラット、エヴァンゲリオンなど。世界中に発送。",
}

export const revalidate = 3600

export default async function HomePageJp() {
  const collections = await getHomeCollections("jp")

  return (
    <div className="min-h-screen">
      <HomePageContent
        dict={jp}
        collections={collections}
        figurePath="/jp/figures"
        joinHref="/jp/register"
      />
    </div>
  )
}
