import { supabaseAdmin } from "@/lib/supabase"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { notFound, redirect } from "next/navigation"
import ProfileEditForm from "@/components/ProfileEditForm"

interface Props { params: { username: string } }

export default async function ProfileEditPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/login")

  const { data: user } = await supabaseAdmin
    .from("users")
    .select(`
      id, username, avatar, bio,
      user_figures(
        status,
        figure:figures(id, name, series, character, manufacturer, scale, year, imageUrl:image_url)
      )
    `)
    .eq("username", params.username)
    .maybeSingle()

  if (!user) notFound()
  if (user.id !== session.user.id) redirect(`/profile/${user.username}`)

  const wishlistFigures = (user.user_figures || [])
    .filter((uf: any) => uf.status === "WISHLIST")
    .map((uf: any) => uf.figure)

  return (
    <ProfileEditForm
      username={user.username}
      currentAvatar={user.avatar ?? null}
      currentBio={user.bio ?? ""}
      wishlistFigures={wishlistFigures}
    />
  )
}
