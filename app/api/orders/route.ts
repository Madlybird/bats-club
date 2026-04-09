import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")

  let query = supabaseAdmin
    .from("orders")
    .select(`
      id, status, quantity, unit_price, shipping_price, shipping_address,
      tracking_number, stripe_session_id,
      createdAt:created_at, updatedAt:updated_at,
      buyerId:buyer_id, listingId:listing_id,
      buyer:users(id, name, email, username),
      listing:listings(
        id, price, condition,
        figure:figures(id, name, series, imageUrl:image_url)
      )
    `)
    .order("created_at", { ascending: false })

  if (!session.user.isAdmin) {
    query = query.eq("buyer_id", session.user.id)
  }

  if (status) {
    query = query.eq("status", status)
  }

  const { data: orders, error } = await query

  if (error) {
    console.error("Get orders error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }

  // Map snake_case fields to camelCase for frontend compatibility
  const result = (orders || []).map((o) => ({
    ...o,
    unitPrice: o.unit_price,
    shippingPrice: o.shipping_price,
    shippingAddress: o.shipping_address,
    trackingNumber: o.tracking_number,
    stripeSessionId: o.stripe_session_id,
  }))

  return NextResponse.json(result)
}
