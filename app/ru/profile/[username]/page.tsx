import { supabaseAdmin } from "@/lib/supabase"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { notFound } from "next/navigation"
import ProfilePageContent from "@/components/ProfilePageContent"
import { ru } from "@/lib/dict"
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

export default async function ProfilePageRu({ params }: Props) {
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
  const have = userFigures.filter((uf) => uf.status === "HAVE")
  const wishlist = userFigures.filter((uf) => uf.status === "WISHLIST")
  const buying = userFigures.filter((uf) => uf.status === "BUY")

  return (
    <ProfilePageContent
      user={{ ...(user as any), userFigures } as any}
      have={have}
      wishlist={wishlist}
      buying={buying}
      dict={ru}
      archiveHref="/archive"
      isOwner={session?.user?.id === user.id}
    />
  )
}
