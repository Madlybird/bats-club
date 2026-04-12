import { supabaseAdmin } from "@/lib/supabase"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { notFound } from "next/navigation"
import ProfilePageContent from "@/components/ProfilePageContent"
import { en } from "@/lib/dict"
import { Metadata } from "next"

interface Props { params: { username: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("name, username")
    .eq("username", params.username)
    .single()
  if (!user) return { title: "User Not Found" }
  return { title: `${user.name} (@${user.username}) | Bats Club` }
}

export default async function ProfilePage({ params }: Props) {
  const [session, { data: user }] = await Promise.all([
    getServerSession(authOptions),
    supabaseAdmin
      .from("users")
      .select(`
        id, name, username, avatar, bio, isAdmin:is_admin, createdAt:created_at,
        user_figures(
          id, status, userId:user_id, figureId:figure_id,
          figure:figures(id, name, series, character, manufacturer, scale, year, imageUrl:image_url)
        )
      `)
      .eq("username", params.username)
      .single(),
  ])

  if (!user) notFound()

  const userFigures = (user.user_figures || []) as any[]
  const have = userFigures.filter((uf: any) => uf.status === "HAVE")
  const wishlist = userFigures.filter((uf: any) => uf.status === "WISHLIST")
  const userId = (user as any).id as string

  // All optional queries wrapped in try-catch to prevent page crash
  let purchaseCount = 0
  let rarityScore = 0
  let rarityPercentile = 100
  const huntingCounts: Record<string, number> = {}
  let activeListings: any[] = []

  try {
    const { count } = await supabaseAdmin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("buyer_id", userId)
      .eq("status", "PAID")
    purchaseCount = count ?? 0
  } catch (e) { console.error("[profile] orders query failed:", e) }

  const haveFigureIds = have.map((uf: any) => uf.figure?.id).filter(Boolean)

  if (haveFigureIds.length > 0) {
    try {
      const { data: figureCounts } = await supabaseAdmin
        .from("user_figures")
        .select("figureId:figure_id")
        .eq("status", "HAVE")
        .in("figure_id", haveFigureIds)
      const countMap = new Map<string, number>()
      for (const row of figureCounts || []) {
        countMap.set(row.figureId, (countMap.get(row.figureId) || 0) + 1)
      }
      for (const fid of haveFigureIds) {
        rarityScore += 1 / (countMap.get(fid) || 1)
      }
      const { count: totalCollectors } = await supabaseAdmin
        .from("user_figures")
        .select("user_id", { count: "exact", head: true })
        .eq("status", "HAVE")
      if (totalCollectors && totalCollectors > 1) {
        rarityPercentile = Math.max(1, Math.round((1 / totalCollectors) * 100))
      }
    } catch (e) { console.error("[profile] rarity query failed:", e) }

    try {
      const { data } = await supabaseAdmin
        .from("listings")
        .select("figureId:figure_id")
        .eq("active", true)
        .in("figure_id", haveFigureIds)
      activeListings = data || []
    } catch (e) { console.error("[profile] listings query failed:", e) }
  }

  const wishlistFigureIds = wishlist.map((uf: any) => uf.figure?.id).filter(Boolean)
  if (wishlistFigureIds.length > 0) {
    try {
      const { data: wishCounts } = await supabaseAdmin
        .from("user_figures")
        .select("figureId:figure_id")
        .eq("status", "WISHLIST")
        .in("figure_id", wishlistFigureIds)
        .neq("user_id", userId)
      for (const row of wishCounts || []) {
        huntingCounts[row.figureId] = (huntingCounts[row.figureId] || 0) + 1
      }
    } catch (e) { console.error("[profile] hunting query failed:", e) }
  }

  return (
    <ProfilePageContent
      user={user as any}
      have={have}
      wishlist={wishlist}
      dict={en}
      archiveHref="/archive"
      profileBasePath="/profile"
      isOwner={session?.user?.id === userId}
      purchaseCount={purchaseCount}
      rarityScore={rarityScore}
      rarityPercentile={rarityPercentile}
      huntingCounts={huntingCounts}
      activeListings={activeListings as any}
      locale="en"
    />
  )
}
