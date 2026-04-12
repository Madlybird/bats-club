import { supabaseAdmin } from "@/lib/supabase"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { notFound } from "next/navigation"
import ProfilePageContent from "@/components/ProfilePageContent"
import { jp } from "@/lib/dict"
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

export default async function ProfilePageJp({ params }: Props) {
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

  const { count: purchaseCount } = await supabaseAdmin
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("buyer_id", (user as any).id)
    .eq("status", "PAID")

  const haveFigureIds = have.map((uf: any) => uf.figure?.id).filter(Boolean)
  let rarityScore = 0
  let rarityPercentile = 100
  if (haveFigureIds.length > 0) {
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
      .select("userId:user_id", { count: "exact", head: true })
      .eq("status", "HAVE")
    if (totalCollectors && totalCollectors > 1) {
      rarityPercentile = Math.max(1, Math.round((1 / totalCollectors) * 100))
    }
  }

  const wishlistFigureIds = wishlist.map((uf: any) => uf.figure?.id).filter(Boolean)
  const huntingCounts: Record<string, number> = {}
  if (wishlistFigureIds.length > 0) {
    const { data: wishCounts } = await supabaseAdmin
      .from("user_figures")
      .select("figureId:figure_id")
      .eq("status", "WISHLIST")
      .in("figure_id", wishlistFigureIds)
      .neq("user_id", (user as any).id)
    for (const row of wishCounts || []) {
      huntingCounts[row.figureId] = (huntingCounts[row.figureId] || 0) + 1
    }
  }

  const { data: activeListings } = await supabaseAdmin
    .from("listings")
    .select("figureId:figure_id")
    .eq("active", true)
    .in("figure_id", haveFigureIds.length > 0 ? haveFigureIds : ["__none__"])

  return (
    <ProfilePageContent
      user={user as any}
      have={have}
      wishlist={wishlist}
      dict={jp}
      archiveHref="/jp/archive"
      profileBasePath="/jp/profile"
      isOwner={session?.user?.id === (user as any).id}
      purchaseCount={purchaseCount ?? 0}
      rarityScore={rarityScore}
      rarityPercentile={rarityPercentile}
      huntingCounts={huntingCounts}
      activeListings={(activeListings || []) as any}
      locale="jp"
    />
  )
}
