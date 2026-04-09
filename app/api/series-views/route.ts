import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const { series } = await req.json()
    if (!series || typeof series !== "string") {
      return NextResponse.json({ error: "series required" }, { status: 400 })
    }

    await supabaseAdmin.rpc("increment_series_views", { p_series: series })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "failed" }, { status: 500 })
  }
}
