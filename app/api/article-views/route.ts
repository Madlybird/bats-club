import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(req: Request) {
  // Unauthenticated DB write — throttle to curb view-count inflation/spam,
  // same reasoning as series-views.
  const limited = checkRateLimit(req, "article-views", 60, 60 * 1000)
  if (limited) return limited

  try {
    const { articleId } = await req.json()
    if (!articleId || typeof articleId !== "string" || articleId.length > 200) {
      return NextResponse.json({ error: "articleId required" }, { status: 400 })
    }

    await supabaseAdmin.rpc("increment_article_views", { p_article_id: articleId })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "failed" }, { status: 500 })
  }
}
