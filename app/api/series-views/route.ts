import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(req: Request) {
  // Unauthenticated DB write — throttle to curb view-count inflation/spam.
  const limited = checkRateLimit(req, "series-views", 60, 60 * 1000)
  if (limited) return limited

  try {
    const { series } = await req.json()
    if (!series || typeof series !== "string" || series.length > 200) {
      return NextResponse.json({ error: "series required" }, { status: 400 })
    }

    await supabaseAdmin.rpc("increment_series_views", { p_series: series })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "failed" }, { status: 500 })
  }
}
