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

const listingId = "14542fcf-d568-40b5-96c0-5057db89e863"

const { data: listing } = await supabase
  .from("listings")
  .select("id, figure_id, seller_id, price, active, figures(name, slug)")
  .eq("id", listingId)
  .maybeSingle()

if (!listing) {
  console.error("Listing not found:", listingId)
  process.exit(1)
}

console.log("Found:", listing)

const { data: orders } = await supabase
  .from("orders")
  .select("id")
  .eq("listing_id", listingId)
const orderCount = (orders || []).length
console.log("Orders tied to listing:", orderCount)
if (orderCount > 0) {
  console.error("Refusing to delete: listing has orders. Aborting to preserve order history.")
  process.exit(1)
}

const { error } = await supabase.from("listings").delete().eq("id", listingId)
if (error) {
  console.error("Listing delete error:", error)
  process.exit(1)
}

console.log("Listing deleted.")
