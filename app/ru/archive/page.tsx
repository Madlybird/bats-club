import { Suspense } from "react"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import ArchiveClient from "@/components/ArchiveClient"
import BatsOverlay from "@/components/BatsOverlay"
import ScrollReveal from "@/components/ScrollReveal"
import { ru } from "@/lib/dict"
import { Metadata } from "next"

function ArchiveSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="aspect-square rounded-2xl border border-white/[0.06] animate-pulse"
          style={{ background: "rgba(255,255,255,0.02)" }}
        />
      ))}
    </div>
  )
}

export const metadata: Metadata = {
  title: "Archive | Bats Club",
  description: "Browse the full Bats Club anime figure archive.",
}

export const revalidate = 60

interface Props {
  searchParams: { series?: string }
}

export default async function ArchivePageRu({ searchParams }: Props) {
  const session = await getServerSession(authOptions)
  const defaultSeries = searchParams.series ?? null

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

  const allCharacters = Array.from(new Set((figures || []).map((f) => f.character))).sort()
  const allManufacturers = Array.from(new Set((figures || []).map((f) => f.manufacturer))).sort()

  const seriesCountMap: Record<string, number> = {}
  for (const f of figures || []) {
    seriesCountMap[f.series] = (seriesCountMap[f.series] ?? 0) + 1
  }
  const seriesCounts = Object.entries(seriesCountMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  const dict = ru

  return (
    <div className="relative min-h-screen">
      <BatsOverlay />
      <div className="absolute top-1/4 right-1/3 w-[700px] h-[700px] rounded-full bg-[#ff2d78]/5 blur-[180px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-purple-900/6 blur-[120px] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="relative">
        <ScrollReveal>
          <div className="border-b border-white/[0.05]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
              <span className="inline-block w-8 h-px bg-[#ff2d78] mb-6" />
              <h1 className="font-black lowercase leading-tight tracking-tighter text-white" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
                {dict.archive_page_title}
              </h1>
              <p className="text-white/35 mt-3 text-base font-medium">
                {(figures || []).length} {dict.archive_figures_suffix}
              </p>
            </div>
          </div>
        </ScrollReveal>
        <ScrollReveal>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <Suspense fallback={<ArchiveSkeleton />}>
              <ArchiveClient
                figures={figuresWithData}
                characters={allCharacters}
                manufacturers={allManufacturers}
                seriesCounts={seriesCounts}
                defaultSeries={defaultSeries}
                labels={{
                  collectionsHeading: dict.archive_collections,
                  searchPh: dict.archive_search_ph,
                  characterLabel: dict.archive_character_label,
                  mfgLabel: dict.archive_mfg_label,
                  resultsWord: dict.archive_results,
                  clearFilters: dict.archive_clear,
                  emptyTitle: dict.archive_empty_title,
                  emptySub: dict.archive_empty_sub,
                  clearAllBtn: dict.archive_clear_all_btn,
                  figurePath: "/ru/figures",
                  forSale: dict.fig_for_sale,
                  wishlisting: dict.fig_wishlisting,
                  noImage: dict.fig_no_image,
                  statusHave: dict.fig_status_have,
                  statusWishlist: dict.fig_status_wishlist,
                  statusBuy: dict.fig_status_buy,
                  toastAddedWishlist: dict.fig_added_wishlist,
                  toastAddedWishlistCart: dict.fig_added_wishlist_cart,
                }}
              />
            </Suspense>
          </div>
        </ScrollReveal>
      </div>
    </div>
  )
}
