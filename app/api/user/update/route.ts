import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { avatar, bio } = await req.json()
    const data: { avatar?: string | null; bio?: string } = {}

    if (typeof avatar !== "undefined") {
      // Avatars are rendered through next/image (server-side fetch), so an
      // arbitrary URL here is an SSRF vector. The UI only ever sets the
      // avatar to one of the user's figure image URLs — enforce that
      // server-side: allow null (clear), or a string that matches an
      // existing figure's image_url. Anything else is rejected.
      if (avatar === null || avatar === "") {
        data.avatar = null
      } else if (typeof avatar === "string") {
        const { data: match } = await supabaseAdmin
          .from("figures")
          .select("id")
          .eq("image_url", avatar)
          .limit(1)
          .maybeSingle()
        if (!match) {
          return NextResponse.json({ error: "Invalid avatar" }, { status: 400 })
        }
        data.avatar = avatar
      } else {
        return NextResponse.json({ error: "Invalid avatar" }, { status: 400 })
      }
    }

    if (typeof bio !== "undefined") data.bio = String(bio ?? "").slice(0, 120)

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
