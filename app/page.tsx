import type { Metadata } from "next"
import HomePageContent from "@/components/HomePageContent"
import { getHomeCollections } from "@/lib/collections"
import { en } from "@/lib/dict"

export const metadata: Metadata = {
  title: "Bats Club: Rare Anime Archive & Studio",
  description:
    "Public archive & art studio of one collector. Rare anime figures, original art, books and cards. Ships worldwide.",
}

export const revalidate = 3600

export default async function HomePage() {
  const collections = await getHomeCollections("en")

  return (
    <div className="min-h-screen">
      <HomePageContent dict={en} collections={collections} />
    </div>
  )
}
