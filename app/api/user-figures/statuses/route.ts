import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

// Lightweight endpoint used by the client-side UserFiguresProvider to
// hydrate the user's status on figure cards after the page (which is
// statically rendered now) has loaded. Returns a compact map keyed by
// figure id, *not* the full join from /api/user-figures.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({}, { status: 200, headers: { "Cache-Control": "no-store" } })
  }

  const { data, error } = await supabaseAdmin
    .from("user_figures")
    .select("figure_id, status")
    .eq("user_id", session.user.id)

  if (error) {
    console.error("[user-figures/statuses] error:", error)
    return NextResponse.json({}, { status: 200, headers: { "Cache-Control": "no-store" } })
  }

  const map: Record<string, string> = {}
  for (const row of data || []) {
    if ((row as any).figure_id && (row as any).status) {
      map[(row as any).figure_id] = (row as any).status
    }
  }

  return NextResponse.json(map, {
    headers: { "Cache-Control": "private, no-store" },
  })
}
