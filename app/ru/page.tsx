import type { Metadata } from "next"
import HomePageContent from "@/components/HomePageContent"
import { getHomeCollections } from "@/lib/collections"
import { ru } from "@/lib/dict"

export const metadata: Metadata = {
  title: "Bats Club — Архив и магазин редких аниме-фигурок",
  description:
    "Подлинные редкие аниме-фигурки из частной коллекции. Японские оригиналы 1990-х — 2000-х: Di Gi Charat, Evangelion и другие. Доставка по миру.",
}

export const revalidate = 3600

export default async function HomePageRu() {
  const collections = await getHomeCollections("ru")

  return (
    <div className="min-h-screen">
      <HomePageContent
        dict={ru}
        collections={collections}
        figurePath="/ru/figures"
        joinHref="/ru/register"
      />
    </div>
  )
}
