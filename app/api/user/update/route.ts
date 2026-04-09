import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { avatar, bio } = await req.json()
    const data: { avatar?: string; bio?: string } = {}
    if (typeof avatar !== "undefined") data.avatar = avatar
    if (typeof bio !== "undefined") data.bio = bio.slice(0, 120)

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .update(data)
      .eq("id", session.user.id)
      .select("avatar, bio")
      .single()

    if (error) throw error

    return NextResponse.json({ ok: true, user: { avatar: user.avatar, bio: user.bio } })
  } catch (err) {
    console.error("[user/update]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
