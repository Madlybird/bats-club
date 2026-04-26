import { supabaseAdmin } from "@/lib/supabase"

/**
 * Counts a user's completed (paid) purchases. Drives both the
 * "Purchases" stat on the profile and the stamp-card progress.
 * Pending and cancelled orders are excluded so partial checkouts
 * don't show up in someone's history or award stamps.
 */
export async function getUserPurchaseCount(userId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("buyer_id", userId)
    .eq("status", "PAID")
  if (error) {
    console.error("[profile] getUserPurchaseCount failed:", error)
    return 0
  }
  return count ?? 0
}

/**
 * Stamps roll over every 10 purchases (10th unlocks a reward),
 * matching the visual on ProfilePageContent.
 */
export async function getUserStampCount(userId: string): Promise<number> {
  const purchases = await getUserPurchaseCount(userId)
  return purchases % 10
}
