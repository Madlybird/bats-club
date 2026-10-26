import { supabaseAdmin } from "@/lib/supabase"
import { PURCHASED_STATUSES } from "@/lib/profile"

/**
 * True when a logged-in member has never completed a purchase — no paid
 * (or shipped/delivered) orders and no hand-credited off-site purchases
 * (users.bonus_stamps). Fails closed: any lookup error → not eligible.
 */
export async function isFirstOrderOfferEligible(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false
  const [orders, user] = await Promise.all([
    supabaseAdmin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("buyer_id", userId)
      .in("status", PURCHASED_STATUSES),
    supabaseAdmin.from("users").select("bonus_stamps").eq("id", userId).maybeSingle(),
  ])
  if (orders.error || user.error || !user.data) {
    if (orders.error || user.error) {
      console.error("[member-offer] eligibility lookup failed:", orders.error || user.error)
    }
    return false
  }
  return (orders.count ?? 0) === 0 && ((user.data as any).bonus_stamps ?? 0) === 0
}
