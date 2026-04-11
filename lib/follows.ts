import { supabaseAdmin } from "@/lib/supabase"

export interface PublicUser {
  id: string
  username: string
  name: string
  avatar: string | null
}

export interface FollowData {
  followers: PublicUser[]
  following: PublicUser[]
  followersCount: number
  followingCount: number
  viewerIsFollowing: boolean
}

/**
 * Fetches the full follower + following lists for a profile, plus
 * whether the current viewer (if any) is already following them.
 *
 * Runs the three queries in parallel. Returns empty data if the
 * `follows` table doesn't exist yet, so profiles still render before
 * the DB migration is applied.
 */
export async function getFollowData(
  profileUserId: string,
  viewerId: string | null,
): Promise<FollowData> {
  const [followersRes, followingRes, viewerRes] = await Promise.all([
    supabaseAdmin
      .from("follows")
      .select("follower:users!follows_follower_id_fkey(id, username, name, avatar)")
      .eq("following_id", profileUserId)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("follows")
      .select("following:users!follows_following_id_fkey(id, username, name, avatar)")
      .eq("follower_id", profileUserId)
      .order("created_at", { ascending: false }),
    viewerId && viewerId !== profileUserId
      ? supabaseAdmin
          .from("follows")
          .select("id")
          .eq("follower_id", viewerId)
          .eq("following_id", profileUserId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null } as const),
  ])

  // If the table doesn't exist (migration not applied yet) every query
  // errors identically — treat as empty.
  if (followersRes.error || followingRes.error) {
    return {
      followers: [],
      following: [],
      followersCount: 0,
      followingCount: 0,
      viewerIsFollowing: false,
    }
  }

  const followers: PublicUser[] = (followersRes.data ?? [])
    .map((r: any) => (Array.isArray(r.follower) ? r.follower[0] : r.follower))
    .filter(Boolean)
  const following: PublicUser[] = (followingRes.data ?? [])
    .map((r: any) => (Array.isArray(r.following) ? r.following[0] : r.following))
    .filter(Boolean)

  return {
    followers,
    following,
    followersCount: followers.length,
    followingCount: following.length,
    viewerIsFollowing: !!viewerRes?.data,
  }
}
