import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// Manually invalidate the ISR cache for figure pages + listings pages.
// Use after editing figures directly in Supabase (admin-panel deletes
// already revalidate automatically via /api/figures/[id]).
//
// Body (all optional):
//   { figureId?: string, paths?: string[] }
// - figureId: also invalidates /figures/[id] for every locale
// - paths:    extra paths to invalidate verbatim
// No body → refresh the figure-listing pages (/, /archive) across locales.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let body: { figureId?: string; paths?: string[] } = {}
  try {
    body = await req.json()
  } catch {
    // empty body is fine
  }

  const revalidated: string[] = []
  const push = (p: string) => {
    revalidatePath(p)
    revalidated.push(p)
  }

  push("/")
  push("/jp")
  push("/ru")
  push("/archive")
  push("/jp/archive")
  push("/ru/archive")

  if (body.figureId) {
    // Revalidate the entire /figures/[slug] page template rather than a
    // single path — slug-based routes don't match a UUID segment literal.
    revalidatePath("/figures/[slug]", "page")
    revalidatePath("/jp/figures/[slug]", "page")
    revalidatePath("/ru/figures/[slug]", "page")
    revalidated.push("/figures/[slug]", "/jp/figures/[slug]", "/ru/figures/[slug]")
  }

  for (const p of body.paths ?? []) {
    if (typeof p === "string" && p.startsWith("/")) push(p)
  }

  return NextResponse.json({ revalidated })
}
