import { NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// Manually invalidate the ISR cache for figure pages + listings pages.
// Use after editing figures/listings directly in Supabase (admin-panel
// deletes already revalidate automatically via /api/figures/[id] and
// /api/listings/[id]).
//
// Body (all optional):
//   { figureId?: string, listingId?: string, paths?: string[] }
// - figureId:  also invalidates /figures/[id] for every locale
// - listingId: also invalidates /shop/[id] for every locale
// - paths:     extra paths to invalidate verbatim
// No body → refresh the figure-listing pages (/) across locales. /archive
// and /shop aren't included — both are force-dynamic (no ISR cache), so
// revalidating them is a no-op.
export async function POST(req: Request) {
  // Two ways in: a logged-in admin session (site admin panel), or a shared
  // secret (the telegram bot, which writes to Supabase directly and has no
  // browser session to authenticate with).
  const providedSecret = req.headers.get("x-revalidate-secret")
  const secretOk = !!process.env.REVALIDATE_SECRET && providedSecret === process.env.REVALIDATE_SECRET

  if (!secretOk) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  let body: { figureId?: string; listingId?: string; artId?: string; paths?: string[] } = {}
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

  revalidateTag("figures")
  revalidated.push("tag:figures")

  push("/")
  push("/jp")
  push("/ru")
  push("/feed.xml")

  // Art section. /art (+ locales) is force-dynamic so revalidating it is a
  // no-op, but the /art/[id] detail template is ISR — refresh it whenever
  // the bot touches an art listing.
  if (body.artId) {
    push("/art")
    push("/ru/art")
    push("/jp/art")
    revalidatePath("/art/[id]", "page")
    revalidatePath("/ru/art/[id]", "page")
    revalidatePath("/jp/art/[id]", "page")
    revalidated.push("/art/[id]", "/ru/art/[id]", "/jp/art/[id]")
  }

  if (body.figureId) {
    // Revalidate the entire /figures/[slug] page template rather than a
    // single path — slug-based routes don't match a UUID segment literal.
    revalidatePath("/figures/[slug]", "page")
    revalidatePath("/jp/figures/[slug]", "page")
    revalidatePath("/ru/figures/[slug]", "page")
    revalidated.push("/figures/[slug]", "/jp/figures/[slug]", "/ru/figures/[slug]")
  }

  if (body.listingId) {
    push(`/shop/${body.listingId}`)
    push(`/jp/shop/${body.listingId}`)
    push(`/ru/shop/${body.listingId}`)
  }

  for (const p of body.paths ?? []) {
    if (typeof p === "string" && p.startsWith("/")) push(p)
  }

  return NextResponse.json({ revalidated })
}
