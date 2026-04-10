import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { data: listing, error } = await supabaseAdmin
    .from("listings")
    .select(`
      id, price, condition, stock, photos, description, active,
      createdAt:created_at, updatedAt:updated_at,
      figureId:figure_id, sellerId:seller_id,
      figure:figures(*),
      seller:users(id, name, username, avatar),
      orders(id, status, createdAt:created_at)
    `)
    .eq("id", params.id)
    .order("created_at", { ascending: false, referencedTable: "orders" })
    .limit(5, { referencedTable: "orders" })
    .single()

  if (error || !listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // Remap figure fields to camelCase
  const figure = listing.figure as any
  return NextResponse.json({
    ...listing,
    figure: figure
      ? { ...figure, imageUrl: figure.image_url, createdAt: figure.created_at }
      : null,
  })
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const { price, condition, stock, description, photos, active } = body

  const updateData: Record<string, any> = {}
  // Client sends price already in cents (integer). Don't multiply again.
  if (price !== undefined) updateData.price = Math.round(Number(price))
  if (condition !== undefined) updateData.condition = condition
  if (stock !== undefined) updateData.stock = parseInt(stock)
  if (description !== undefined) updateData.description = description
  if (photos !== undefined) updateData.photos = photos
  if (active !== undefined) updateData.active = active

  const { data: listing, error } = await supabaseAdmin
    .from("listings")
    .update(updateData)
    .eq("id", params.id)
    .select(`
      id, price, condition, stock, photos, description, active,
      createdAt:created_at, figureId:figure_id,
      figure:figures(name)
    `)
    .single()

  if (error) {
    console.error("Update listing error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }

  // Invalidate caches so the change is visible immediately on the site.
  const figureId = (listing as any)?.figureId
  try {
    revalidatePath("/shop")
    revalidatePath("/ru/shop")
    revalidatePath("/jp/shop")
    revalidatePath(`/shop/${params.id}`)
    revalidatePath(`/ru/shop/${params.id}`)
    revalidatePath(`/jp/shop/${params.id}`)
    if (figureId) {
      revalidatePath(`/figures/${figureId}`)
      revalidatePath(`/ru/figures/${figureId}`)
      revalidatePath(`/jp/figures/${figureId}`)
    }
  } catch (e) {
    console.error("revalidatePath error:", e)
  }

  return NextResponse.json(listing)
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { error } = await supabaseAdmin
    .from("listings")
    .update({ active: false })
    .eq("id", params.id)

  if (error) {
    console.error("Delete listing error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
