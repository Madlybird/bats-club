import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

/**
 * POST /api/follow   body: { followingId }   — follow a user
 * DELETE /api/follow body: { followingId }   — unfollow a user
 *
 * Both require an authenticated session. Self-follow is rejected both
 * here and by a CHECK constraint on the follows table.
 */

async function parseFollowingId(req: Request): Promise<string | null> {
  try {
    const body = await req.json()
    const id = body?.followingId
    return typeof id === "string" && id.length > 0 ? id : null
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const followingId = await parseFollowingId(req)
  if (!followingId) {
    return NextResponse.json({ error: "followingId is required" }, { status: 400 })
  }
  if (followingId === session.user.id) {
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 })
  }

  // Verify target user exists so we return a 404 instead of a cryptic
  // FK-violation 500.
  const { data: target } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("id", followingId)
    .maybeSingle()
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const { error } = await supabaseAdmin
    .from("follows")
    .upsert(
      { follower_id: session.user.id, following_id: followingId },
      { onConflict: "follower_id,following_id", ignoreDuplicates: true },
    )

  if (error) {
    console.error("[api/follow POST] insert error:", error)
    return NextResponse.json({ error: "Failed to follow" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, followingId })
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const followingId = await parseFollowingId(req)
  if (!followingId) {
    return NextResponse.json({ error: "followingId is required" }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from("follows")
    .delete()
    .eq("follower_id", session.user.id)
    .eq("following_id", followingId)

  if (error) {
    console.error("[api/follow DELETE] error:", error)
    return NextResponse.json({ error: "Failed to unfollow" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, followingId })
}
