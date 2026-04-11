import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

/**
 * GET /api/follow/[username]
 *   → { followers: PublicUser[], following: PublicUser[], counts: {...} }
 *
 * Returns the full follower and following lists for one profile so
 * the Followers / Following tabs can render them. Public — no auth
 * required.
 */

interface PublicUser {
  id: string
  username: string
  name: string
  avatar: string | null
}

export async function GET(
  _req: Request,
  { params }: { params: { username: string } },
) {
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("username", params.username)
    .maybeSingle()

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // Followers: rows where this user is the TARGET. Join the follower's
  // public profile through the `follower_id` FK.
  // Following: rows where this user is the FOLLOWER.
  const [followersRes, followingRes] = await Promise.all([
    supabaseAdmin
      .from("follows")
      .select("follower:users!follows_follower_id_fkey(id, username, name, avatar)")
      .eq("following_id", user.id)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("follows")
      .select("following:users!follows_following_id_fkey(id, username, name, avatar)")
      .eq("follower_id", user.id)
      .order("created_at", { ascending: false }),
  ])

  if (followersRes.error || followingRes.error) {
    console.error("[api/follow/[username]] query error:", followersRes.error, followingRes.error)
    return NextResponse.json({ error: "Failed to load follows" }, { status: 500 })
  }

  const followers: PublicUser[] = (followersRes.data ?? [])
    .map((r: any) => (Array.isArray(r.follower) ? r.follower[0] : r.follower))
    .filter(Boolean)
  const following: PublicUser[] = (followingRes.data ?? [])
    .map((r: any) => (Array.isArray(r.following) ? r.following[0] : r.following))
    .filter(Boolean)

  return NextResponse.json({
    followers,
    following,
    counts: { followers: followers.length, following: following.length },
  })
}
