import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "node:fs"

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=")
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, "")]
    }),
)

const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SECRET_KEY
if (!url || !key) {
  console.error("Missing SUPABASE env vars in .env.local")
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const identifier = "32f1b8ac-f7a3-4cf2-9c33-b6f3bb6febf2"

const { data: byId } = await supabase
  .from("figures")
  .select("id, slug, name")
  .eq("id", identifier)
  .maybeSingle()

let target = byId
if (!target) {
  const { data: bySlug } = await supabase
    .from("figures")
    .select("id, slug, name")
    .eq("slug", identifier)
    .maybeSingle()
  target = bySlug
}

if (!target) {
  console.error("Figure not found:", identifier)
  process.exit(1)
}

console.log("Found:", target)

const { data: listings } = await supabase
  .from("listings")
  .select("id")
  .eq("figure_id", target.id)
const listingIds = (listings || []).map((l) => l.id)
console.log("Listings:", listingIds.length)

if (listingIds.length > 0) {
  const { data: orders } = await supabase
    .from("orders")
    .select("id")
    .in("listing_id", listingIds)
  const orderCount = (orders || []).length
  console.log("Orders tied to listings:", orderCount)
  if (orderCount > 0) {
    console.error("Refusing to delete: figure has orders. Aborting to preserve order history.")
    process.exit(1)
  }

  const { error: listingsErr } = await supabase
    .from("listings")
    .delete()
    .in("id", listingIds)
  if (listingsErr) {
    console.error("Listings delete error:", listingsErr)
    process.exit(1)
  }
  console.log("Deleted", listingIds.length, "listing(s).")
}

const { error: figErr } = await supabase.from("figures").delete().eq("id", target.id)
if (figErr) {
  console.error("Figure delete error:", figErr)
  process.exit(1)
}

console.log("Figure deleted (cascades user_figures + article_figures).")
