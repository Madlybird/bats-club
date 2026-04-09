import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select(`
      id, status, quantity, unit_price, shipping_price, shipping_address,
      tracking_number, stripe_session_id,
      createdAt:created_at, updatedAt:updated_at,
      buyerId:buyer_id, listingId:listing_id,
      buyer:users(id, name, email, username),
      listing:listings(
        id, price, condition, photos,
        figure:figures(*),
        seller:users(id, name, username)
      )
    `)
    .eq("id", params.id)
    .single()

  if (error || !order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const buyerIdRaw = (order as any).buyer_id || (order as any).buyerId
  if (!session.user.isAdmin && buyerIdRaw !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Map nested figure fields
  const listing = order.listing as any
  if (listing?.figure) {
    listing.figure = {
      ...listing.figure,
      imageUrl: listing.figure.image_url,
      createdAt: listing.figure.created_at,
    }
  }

  return NextResponse.json({
    ...order,
    unitPrice: order.unit_price,
    shippingPrice: order.shipping_price,
    shippingAddress: order.shipping_address,
    trackingNumber: order.tracking_number,
    stripeSessionId: order.stripe_session_id,
  })
}

const VALID_STATUSES = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"]

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const { status, trackingNumber } = body

  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  const updateData: Record<string, any> = {}
  if (status) updateData.status = status
  if (trackingNumber !== undefined) updateData.tracking_number = trackingNumber

  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .update(updateData)
    .eq("id", params.id)
    .select(`
      id, status, tracking_number,
      buyer:users(name, email),
      listing:listings(figure:figures(name))
    `)
    .single()

  if (error) {
    console.error("Update order error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }

  return NextResponse.json({
    ...order,
    trackingNumber: order.tracking_number,
  })
}
