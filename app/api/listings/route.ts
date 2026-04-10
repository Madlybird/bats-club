import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const figureId = searchParams.get("figureId")
  const condition = searchParams.get("condition")
  const sort = searchParams.get("sort") || "newest"

  let query = supabaseAdmin
    .from("listings")
    .select(`
      id, price, condition, stock, photos, description, active,
      createdAt:created_at, updatedAt:updated_at,
      figureId:figure_id, sellerId:seller_id,
      figure:figures(id, name, series, character, scale, imageUrl:image_url),
      seller:users(id, name, username),
      orders(id)
    `)
    .eq("active", true)
    .gt("stock", 0)

  if (figureId) query = query.eq("figure_id", figureId)
  if (condition) query = query.eq("condition", condition)

  if (sort === "price-asc") query = query.order("price", { ascending: true })
  else if (sort === "price-desc") query = query.order("price", { ascending: false })
  else query = query.order("created_at", { ascending: false })

  const { data: listings, error } = await query

  if (error) {
    console.error("Get listings error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }

  const result = (listings || []).map((l) => ({
    ...l,
    _count: { orders: (l.orders || []).length },
  }))

  return NextResponse.json(result)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { figureId, price, condition, stock, description, photos } = body

    if (!figureId || !price || !condition) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data: listing, error } = await supabaseAdmin
      .from("listings")
      .insert({
        figure_id: figureId,
        seller_id: session.user.id,
        // Client sends price already in cents (integer). Don't multiply again.
        price: Math.round(Number(price)),
        condition,
        stock: parseInt(stock) || 1,
        description: description || null,
        photos: photos || [],
        active: true,
      })
      .select(`
        id, price, condition, stock, photos, description, active,
        createdAt:created_at, figureId:figure_id, sellerId:seller_id,
        figure:figures(name, series)
      `)
      .single()

    if (error) throw error

    try {
      revalidatePath("/shop")
      revalidatePath("/ru/shop")
      revalidatePath("/jp/shop")
      if (figureId) {
        revalidatePath(`/figures/${figureId}`)
        revalidatePath(`/ru/figures/${figureId}`)
        revalidatePath(`/jp/figures/${figureId}`)
      }
    } catch (e) {
      console.error("revalidatePath error:", e)
    }

    return NextResponse.json(listing, { status: 201 })
  } catch (error) {
    console.error("Create listing error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
