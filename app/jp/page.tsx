import type { Metadata } from "next"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import HomePageContent from "@/components/HomePageContent"
import { jp } from "@/lib/dict"

export const metadata: Metadata = {
  title: "Bats Club — レアアニメフィギュアのアーカイブ＆マーケットプレイス",
  description:
    "プライベートコレクターによる本物のレアアニメフィギュア。1990〜2000年代の日本オリジナル品。デジ・キャラット、エヴァンゲリオンなど。世界中に発送。",
}

export const revalidate = 3600

export default async function HomePageJp() {
  const session = await getServerSession(authOptions)

  const { data: figures } = await supabaseAdmin
    .from("figures")
    .select("id, name, series, character, manufacturer, scale, year, imageUrl:image_url, user_figures(userId:user_id, status), listings(id, active, price, condition)")
    .order("created_at", { ascending: false })

  const figuresWithData = (figures || []).map((f) => {
    const activeListings = (f.listings || []).filter((l: any) => l.active)
    const cheapest = activeListings.length > 0
      ? activeListings.reduce((a: any, b: any) => (a.price <= b.price ? a : b))
      : null
    return {
      id: f.id,
      name: f.name,
      series: f.series,
      character: f.character,
      manufacturer: f.manufacturer,
      scale: f.scale,
      year: f.year,
      imageUrl: f.imageUrl,
      wishlistCount: (f.user_figures || []).filter((uf: any) => uf.status === "WISHLIST").length,
      userStatus: session
        ? ((f.user_figures || []).find((uf: any) => uf.userId === session.user.id)?.status ?? null)
        : null,
      _count: { listings: activeListings.length },
      cheapestListing: cheapest
        ? { id: cheapest.id, price: cheapest.price, condition: cheapest.condition }
        : null,
    }
  })

  const allManufacturers = Array.from(new Set((figures || []).map((f) => f.manufacturer))).sort()
  const minYear = figures && figures.length > 0 ? Math.min(...figures.map((f) => f.year)) : new Date().getFullYear()

  return (
    <div className="min-h-screen">
      <HomePageContent
        dict={jp}
        figures={figuresWithData}
        allManufacturers={allManufacturers}
        hasSession={!!session}
        yearsCollecting={new Date().getFullYear() - minYear}
        figurePath="/jp/figures"
      />
    </div>
  )
}
