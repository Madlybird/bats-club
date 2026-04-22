import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export const dynamic = "force-dynamic"

const WELCOME_BODY = `Bats Club is an open private archive of rare vintage anime figures from the 90s and early 2000s. Di Gi Charat, Evangelion, Strawberry Marshmallow, Range Murata, Shirow Masamune. Early Kaiyodo and pre-consolidation Good Smile. Wonder Festival pieces, magazine inserts, prize lines, gashapon. Figures that shaped an entire collector culture, and that get harder to find in real condition with every year.

## Digital Digging Experience

Any collector knows the feeling of hunting for a figure and hitting a wall. The references don't exist. The sculptor's name is a dead end. Most of what's online is one blurry photo and a dead link. From physical shops to digital ones, there is always data missing, and most of it was never written down in the first place.

Bats Club is built to be the place where that stops happening. The archive holds the best selection of vintage figures from the era together with the context around them: series, year, manufacturer, sculptor where the credit can be traced, production run, variant. You dig through otaku history the same way you dig through your own memory — by series you loved, by years that mattered, by the names of people whose work kept coming back to you across different projects. One figure opens onto the next. A variant you didn't know existed. A release date that finally explains why two pieces you own don't quite match. Half an hour in, you've opened fifteen figures and forgotten what you came looking for.

Mark what you already have. Add what you want next to your wishlist. Shape your own collector profile as you go. Keeping your collection inside the archive matters as much as keeping it on the shelf. It's how you track what you own from anywhere, and it's how you decide, with real information in front of you, which figure becomes the next one you bring home.

## Your Profile

Add your own figures to a collector profile, and the archive grows with you. Your shelves, your digs, your notes, sitting inside the record next to everything else. By adding the pieces you own and the ones you're hunting, you can share your collection with other collectors and across social media, and see your collection scored against the archive itself.

## The Wishlist

Every figure in the archive exists within Bats Club reach. We're collectors too, and we understand how much it matters to chase a specific piece for years. The more wishlists a figure accumulates, the closer it moves to being released from the archive and opened for purchase. So the pieces that come out next are the ones the community is actually hunting for.

## The Stamps

The stamps come from the feeling of walking through Akihabara. The small Tokyo shops, the handwritten tags, the ink marks that tell you a person picked this piece and put it in the box for you. Every figure that ships from Bats Club carries them. And they come with perks.

Bats Club is where you find the rarest figures in the world, share the hunt with a community of collectors, and become a true collector yourself.`

const WELCOME_META =
  "Bats Club is an open private archive of rare vintage anime figures from the 90s and 2000s. Dig through the archive, build your profile, wishlist rare pieces to unlock them for the community."

const WELCOME_COVER = "https://i.postimg.cc/8zNdXYnb/photo-2026-02-19-18-43-14.jpg"

async function seed() {
  // Verify admin against the DB — tolerates stale JWT where session.isAdmin
  // may be false but the users row is actually is_admin=true.
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, error: "Sign in first" }, { status: 401 })
  }

  const { data: me, error: meErr } = await supabaseAdmin
    .from("users")
    .select("id, email, is_admin")
    .eq("email", session.user.email)
    .maybeSingle()
  if (meErr) {
    return NextResponse.json(
      { ok: false, error: meErr.message, stage: "lookup-self", code: meErr.code },
      { status: 500 }
    )
  }
  if (!me || !me.is_admin) {
    return NextResponse.json(
      { ok: false, error: "Your users row is not flagged is_admin=true", stage: "authz" },
      { status: 403 }
    )
  }

  // Does the welcome article already exist? If yes, update in place.
  const { data: existing } = await supabaseAdmin
    .from("articles")
    .select("id")
    .eq("slug", "welcome-to-bats-club")
    .maybeSingle()

  const payload = {
    title: "Welcome to Bats Club",
    slug: "welcome-to-bats-club",
    body: WELCOME_BODY,
    excerpt: WELCOME_META,
    meta_description: WELCOME_META,
    cover_image: WELCOME_COVER,
    author_id: me.id,
    published: true,
    pinned: true,
  }

  if (existing) {
    const { data, error } = await supabaseAdmin
      .from("articles")
      .update(payload)
      .eq("id", existing.id)
      .select("id, slug, pinned, published")
      .single()
    if (error) {
      return NextResponse.json(
        { ok: false, action: "updated", error: error.message, code: error.code, details: error.details, hint: error.hint },
        { status: 500 }
      )
    }
    return NextResponse.json({ ok: true, action: "updated", article: data })
  }

  const { data, error } = await supabaseAdmin
    .from("articles")
    .insert(payload)
    .select("id, slug, pinned, published")
    .single()
  if (error) {
    return NextResponse.json(
      { ok: false, action: "inserted", error: error.message, code: error.code, details: error.details, hint: error.hint },
      { status: 500 }
    )
  }
  return NextResponse.json({ ok: true, action: "inserted", article: data })
}

export async function POST() {
  return seed()
}

export async function GET() {
  return seed()
}
