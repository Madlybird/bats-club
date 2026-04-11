import type { Metadata } from "next"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import HomePageContent from "@/components/HomePageContent"
import { en } from "@/lib/dict"

export const metadata: Metadata = {
  title: "Bats Club — Rare Anime Figure Archive & Marketplace",
  description:
    "Authentic rare anime figures from a private collector. 1990s–2000s Japanese originals. Di Gi Charat, Evangelion, and more. Ships worldwide.",
}

export const revalidate = 60

export default async function HomePage() {
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
        dict={en}
        figures={figuresWithData}
        allManufacturers={allManufacturers}
        hasSession={!!session}
        yearsCollecting={new Date().getFullYear() - minYear}
      />
    </div>
  )
}
