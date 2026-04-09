import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { figureId, status } = await req.json()

  if (!figureId || !["HAVE", "WISHLIST", "BUY"].includes(status)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const { data: userFigure, error } = await supabaseAdmin
    .from("user_figures")
    .upsert(
      { user_id: session.user.id, figure_id: figureId, status },
      { onConflict: "user_id,figure_id" }
    )
    .select()
    .single()

  if (error) {
    console.error("Upsert user figure error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }

  return NextResponse.json({
    ...userFigure,
    userId: userFigure.user_id,
    figureId: userFigure.figure_id,
  })
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { figureId } = await req.json()

  const { error } = await supabaseAdmin
    .from("user_figures")
    .delete()
    .eq("user_id", session.user.id)
    .eq("figure_id", figureId)

  if (error) {
    console.error("Delete user figure error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: userFigures, error } = await supabaseAdmin
    .from("user_figures")
    .select(`
      id, status,
      userId:user_id, figureId:figure_id,
      figure:figures(
        id, name, series, character, manufacturer, scale, year,
        sculptor, material, imageUrl:image_url, description, createdAt:created_at
      )
    `)
    .eq("user_id", session.user.id)

  if (error) {
    console.error("Get user figures error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }

  return NextResponse.json(userFigures || [])
}
