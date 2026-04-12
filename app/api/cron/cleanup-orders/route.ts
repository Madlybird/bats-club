import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

/**
 * Cron job: cancels PENDING orders older than 30 minutes.
 *
 * When a user starts Stripe checkout but abandons it (closes tab,
 * card declined, etc.), the order rows stay PENDING. Stripe fires
 * `checkout.session.expired` after ~24h, but we want faster cleanup
 * so the figures become available for other buyers sooner.
 *
 * Runs every 10 minutes via Vercel Cron (see vercel.json).
 */
export async function GET(req: Request) {
  // Verify the request comes from Vercel Cron
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString()

  const { data: staleOrders, error: fetchError } = await supabaseAdmin
    .from("orders")
    .select("id, listing_id")
    .eq("status", "PENDING")
    .lt("created_at", cutoff)

  if (fetchError) {
    console.error("[cleanup-orders] fetch error:", fetchError)
    return NextResponse.json({ error: "Failed to fetch stale orders" }, { status: 500 })
  }

  if (!staleOrders || staleOrders.length === 0) {
    return NextResponse.json({ cancelled: 0 })
  }

  const { error: updateError } = await supabaseAdmin
    .from("orders")
    .update({ status: "CANCELLED" })
    .eq("status", "PENDING")
    .lt("created_at", cutoff)

  if (updateError) {
    console.error("[cleanup-orders] update error:", updateError)
    return NextResponse.json({ error: "Failed to cancel stale orders" }, { status: 500 })
  }

  console.log(`[cleanup-orders] cancelled ${staleOrders.length} stale PENDING order(s)`)

  return NextResponse.json({ cancelled: staleOrders.length })
}
