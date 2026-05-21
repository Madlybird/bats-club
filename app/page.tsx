import type { Metadata } from "next"
import HomePageContent from "@/components/HomePageContent"
import { getHomeCollections } from "@/lib/collections"
import { en } from "@/lib/dict"

export const metadata: Metadata = {
  title: "Bats Club — Rare Anime Figure Archive & Marketplace",
  description:
    "Authentic rare anime figures from a private collector. 1990s–2000s Japanese originals. Di Gi Charat, Evangelion, and more. Ships worldwide.",
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
