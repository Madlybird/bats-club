import type { Metadata } from "next"
import HomePageContent from "@/components/HomePageContent"
import { getHomeCollections } from "@/lib/collections"
import { ru } from "@/lib/dict"

export const metadata: Metadata = {
  title: "Bats Club: архив и студия редкого аниме",
  description:
    "Публичный архив и арт-студия одного коллекционера. Редкие аниме-фигурки, оригинальный арт, книги и карточки. Доставка по всему миру.",
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
