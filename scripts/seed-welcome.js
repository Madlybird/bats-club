// One-shot seeder for the "Welcome to Bats Club" article.
// Run: node scripts/seed-welcome.js

const fs = require("fs")
const path = require("path")
const { createClient } = require("@supabase/supabase-js")

// Minimal .env.local loader — only what we need
const env = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8")
const read = (k) => {
  const m = env.match(new RegExp("^" + k + "=(.*)$", "m"))
  return m ? m[1].trim() : null
}

const url = read("NEXT_PUBLIC_SUPABASE_URL")
const key = read("SUPABASE_SECRET_KEY") || read("SUPABASE_SERVICE_ROLE_KEY")
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local")
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

const ADMIN_EMAIL = "kiwisinbioxbird@gmail.com"
const SLUG = "welcome-to-bats-club"

const BODY = `Bats Club is an open private archive of rare vintage anime figures from the 90s and early 2000s. Di Gi Charat, Evangelion, Strawberry Marshmallow, Range Murata, Shirow Masamune. Early Kaiyodo and pre-consolidation Good Smile. Wonder Festival pieces, magazine inserts, prize lines, gashapon. Figures that shaped an entire collector culture, and that get harder to find in real condition with every year.

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

const META =
  "Bats Club is an open private archive of rare vintage anime figures from the 90s and 2000s. Dig through the archive, build your profile, wishlist rare pieces to unlock them for the community."
const COVER = "https://i.postimg.cc/8zNdXYnb/photo-2026-02-19-18-43-14.jpg"

async function main() {
  // 1. Find the admin's user row
  const { data: user, error: userErr } = await supabase
    .from("users")
    .select("id, email, is_admin")
    .eq("email", ADMIN_EMAIL)
    .single()
  if (userErr || !user) {
    console.error("Could not find admin user:", userErr?.message || "no row")
    process.exit(1)
  }
  if (!user.is_admin) {
    console.error(`User ${ADMIN_EMAIL} exists but is_admin=false. Flip is_admin first.`)
    process.exit(1)
  }
  console.log(`Found admin user: ${user.email} (id=${user.id})`)

  // 2. Build payload, trying the full shape first
  const fullPayload = {
    title: "Welcome to Bats Club",
    slug: SLUG,
    body: BODY,
    excerpt: META,
    meta_description: META,
    cover_image: COVER,
    author_id: user.id,
    published: true,
    pinned: true,
  }

  // 3. Already exists?
  const { data: existing } = await supabase
    .from("articles")
    .select("id")
    .eq("slug", SLUG)
    .maybeSingle()

  const selFull = "id, slug, pinned, published"
  const selBasic = "id, slug, published"
  const opFull = existing
    ? (p) => supabase.from("articles").update(p).eq("id", existing.id).select(selFull).single()
    : (p) => supabase.from("articles").insert(p).select(selFull).single()
  const opBasic = existing
    ? (p) => supabase.from("articles").update(p).eq("id", existing.id).select(selBasic).single()
    : (p) => supabase.from("articles").insert(p).select(selBasic).single()

  let { data, error } = await opFull(fullPayload)

  if (error && (error.code === "PGRST204" || error.code === "42703" || /column/i.test(error.message || ""))) {
    console.warn(`Full-shape ${existing ? "update" : "insert"} failed (${error.message}). Retrying without pinned/meta_description.`)
    const basic = { ...fullPayload }
    delete basic.pinned
    delete basic.meta_description
    const retry = await opBasic(basic)
    data = retry.data
    error = retry.error
    if (!error) {
      console.warn("Article seeded without pinned/meta_description — run this SQL in Supabase to add them:")
      console.warn("  ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT FALSE;")
      console.warn("  ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS meta_description TEXT;")
      console.warn("  NOTIFY pgrst, 'reload schema';")
    }
  }

  if (error) {
    console.error(`${existing ? "UPDATE" : "INSERT"} failed:`, error)
    process.exit(1)
  }
  console.log(`${existing ? "UPDATED" : "INSERTED"}:`, data)
}

main().catch((e) => {
  console.error("Unexpected:", e)
  process.exit(1)
})
