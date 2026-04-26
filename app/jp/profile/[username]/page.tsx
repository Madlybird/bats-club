import { supabaseAdmin } from "@/lib/supabase"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { notFound } from "next/navigation"
import ProfilePageContent from "@/components/ProfilePageContent"
import { jp } from "@/lib/dict"
import { getUserPurchaseCount } from "@/lib/profile"
import { Metadata } from "next"

interface Props { params: { username: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const decodedUsername = decodeURIComponent(params.username)
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("name, username")
    .eq("username", decodedUsername)
    .maybeSingle()
  if (!user) return { title: "User Not Found" }
  return { title: `${user.name} (@${user.username}) | Bats Club` }
}

export default async function ProfilePageJp({ params }: Props) {
  const decodedUsername = decodeURIComponent(params.username)
  const [session, { data: user, error: userError }] = await Promise.all([
    getServerSession(authOptions),
    supabaseAdmin
      .from("users")
      .select("id, name, username, avatar, bio, isAdmin:is_admin, createdAt:created_at")
      .eq("username", decodedUsername)
      .maybeSingle(),
  ])

  if (!user || userError) { console.error("[profile] user query failed:", userError); notFound() }

  const userId = user.id as string
  let have: any[] = []
  let wishlist: any[] = []
  try {
    const { data: userFigures } = await supabaseAdmin
      .from("user_figures")
      .select("id, status, userId:user_id, figureId:figure_id, figure:figures(id, name, series, character, manufacturer, scale, year, imageUrl:image_url)")
      .eq("user_id", userId)
    const figures = (userFigures || []) as any[]
    have = figures.filter((uf) => uf.status === "HAVE")
    wishlist = figures.filter((uf) => uf.status === "WISHLIST")
  } catch (e) { console.error("[profile] user_figures query failed:", e) }

  const purchaseCount = await getUserPurchaseCount(userId)

  const haveFigureIds = have.map((uf: any) => uf.figure?.id).filter(Boolean)
  let rarityScore = 0, rarityPercentile = 100, activeListings: any[] = []

  if (haveFigureIds.length > 0) {
    try {
      const { data: figureCounts } = await supabaseAdmin.from("user_figures").select("figureId:figure_id").eq("status", "HAVE").in("figure_id", haveFigureIds)
      const countMap = new Map<string, number>()
      for (const row of figureCounts || []) countMap.set(row.figureId, (countMap.get(row.figureId) || 0) + 1)
      for (const fid of haveFigureIds) rarityScore += 1 / (countMap.get(fid) || 1)
      const { count: tc } = await supabaseAdmin.from("user_figures").select("user_id", { count: "exact", head: true }).eq("status", "HAVE")
      if (tc && tc > 1) rarityPercentile = Math.max(1, Math.round((1 / tc) * 100))
    } catch {}
    try { const { data } = await supabaseAdmin.from("listings").select("figureId:figure_id").eq("active", true).in("figure_id", haveFigureIds); activeListings = data || [] } catch {}
  }

  const wishlistFigureIds = wishlist.map((uf: any) => uf.figure?.id).filter(Boolean)
  const huntingCounts: Record<string, number> = {}
  if (wishlistFigureIds.length > 0) {
    try {
      const { data: wc } = await supabaseAdmin.from("user_figures").select("figureId:figure_id").eq("status", "WISHLIST").in("figure_id", wishlistFigureIds).neq("user_id", userId)
      for (const row of wc || []) huntingCounts[row.figureId] = (huntingCounts[row.figureId] || 0) + 1
    } catch {}
  }

  return (
    <ProfilePageContent user={user as any} have={have} wishlist={wishlist} dict={jp} archiveHref="/jp/archive" profileBasePath="/jp/profile"
      isOwner={session?.user?.id === userId} purchaseCount={purchaseCount} rarityScore={rarityScore} rarityPercentile={rarityPercentile}
      huntingCounts={huntingCounts} activeListings={activeListings as any} locale="jp" />
  )
}
