import type { Metadata } from "next"
import HomePageContent from "@/components/HomePageContent"
import { getHomeCollections } from "@/lib/collections"
import { jp } from "@/lib/dict"

export const metadata: Metadata = {
  title: "Bats Club:レアアニメのアーカイブ＆スタジオ",
  description:
    "一人のコレクターによる公開アーカイブ&アートスタジオ。レアなアニメフィギュア、オリジナルアート、書籍、カードを取り扱っています。世界中に発送。",
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
