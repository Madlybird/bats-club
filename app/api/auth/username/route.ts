import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { checkRateLimit } from "@/lib/rate-limit"
import { USERNAME_RE, isUsernameAvailable, suggestUsername } from "@/lib/google-auth"

// Username step shown once after a first Google sign-in. Leaving the field
// empty keeps the auto-assigned username.
export async function POST(req: Request) {
  const limited = checkRateLimit(req, "username", 20, 10 * 60 * 1000)
  if (limited) return limited

  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 })
  // Only during the one-time step after a first Google sign-in — the site
  // has no general "rename" feature (it would break old profile links).
  if (!session.user.needsUsername) {
    return NextResponse.json({ error: "Username can't be changed here" }, { status: 403 })
  }

  let username = ""
  try {
    username = String((await req.json())?.username ?? "").trim()
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  // Empty → keep the auto username; nothing to write.
  if (!username || username === session.user.username) {
    return NextResponse.json({ ok: true, username: session.user.username })
  }

  if (!USERNAME_RE.test(username)) {
    return NextResponse.json(
      { error: "Username must be 3–30 characters: letters, numbers, _ or -" },
      { status: 400 },
    )
  }

  try {
    if (!(await isUsernameAvailable(username, userId))) {
      const { data: me } = await supabaseAdmin.from("users").select("email").eq("id", userId).maybeSingle()
      const suggestion = me?.email ? await suggestUsername(me.email, userId) : undefined
      return NextResponse.json({ error: "Username already taken", suggestion }, { status: 409 })
    }
    const { error } = await supabaseAdmin.from("users").update({ username }).eq("id", userId)
    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Username already taken" }, { status: 409 })
      }
      throw error
    }
    return NextResponse.json({ ok: true, username })
  } catch (e: any) {
    console.error("[username] update failed:", e?.message)
    return NextResponse.json({ error: "Request failed" }, { status: 500 })
  }
}
