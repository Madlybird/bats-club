import { supabaseAdmin } from "@/lib/supabase"

/**
 * Counts a user's completed (paid) purchases. Drives both the
 * "Purchases" stat on the profile and the stamp-card progress.
 * Pending and cancelled orders are excluded so partial checkouts
 * don't show up in someone's history or award stamps.
 * users.bonus_stamps (migration 013) adds purchases made off-site
 * that were credited by hand.
 */
export async function getUserPurchaseCount(userId: string): Promise<number> {
  const [orders, user] = await Promise.all([
    supabaseAdmin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("buyer_id", userId)
      .eq("status", "PAID"),
    supabaseAdmin.from("users").select("bonus_stamps").eq("id", userId).maybeSingle(),
  ])
  if (orders.error) {
    console.error("[profile] getUserPurchaseCount failed:", orders.error)
  }
  // A missing column (migration not applied) just means no bonus.
  const bonus = user.error ? 0 : ((user.data as any)?.bonus_stamps ?? 0)
  return (orders.error ? 0 : orders.count ?? 0) + bonus
}

/**
 * Stamps roll over every 10 purchases (10th unlocks a reward),
 * matching the visual on ProfilePageContent.
 */
export async function getUserStampCount(userId: string): Promise<number> {
  const purchases = await getUserPurchaseCount(userId)
  return purchases % 10
}
