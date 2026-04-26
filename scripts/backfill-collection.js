// Backfill user_figures rows for existing PAID orders, so figures
// the buyer paid for show up in their collection. Re-runnable —
// upserts on (user_id, figure_id) so it never creates duplicates.
//
// Run: node scripts/backfill-collection.js
// Optional: ORDER_ID=<uuid> node scripts/backfill-collection.js

const fs = require("fs")
const path = require("path")
const { createClient } = require("@supabase/supabase-js")

const env = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8")
const read = (k) => {
  const m = env.match(new RegExp("^" + k + "=(.*)$", "m"))
  if (!m) return null
  return m[1].trim().replace(/^"(.*)"$/, "$1")
}

const supabase = createClient(read("NEXT_PUBLIC_SUPABASE_URL"), read("SUPABASE_SECRET_KEY"), {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  const onlyOrderId = process.env.ORDER_ID || null
  let q = supabase
    .from("orders")
    .select("id, buyer_id, listing_id, listing:listings(figure_id)")
    .eq("status", "PAID")
  if (onlyOrderId) q = q.eq("id", onlyOrderId)

  const { data: orders, error } = await q
  if (error) throw error
  console.log(`Found ${orders?.length || 0} PAID order(s)`)

  let added = 0
  for (const o of orders || []) {
    const listing = Array.isArray(o.listing) ? o.listing[0] : o.listing
    const figureId = listing?.figure_id
    if (!o.buyer_id || !figureId) {
      console.log(`  - skip ${o.id}: buyer_id=${o.buyer_id} figure_id=${figureId}`)
      continue
    }
    const { error: upsertError } = await supabase
      .from("user_figures")
      .upsert(
        { user_id: o.buyer_id, figure_id: figureId, status: "HAVE" },
        { onConflict: "user_id,figure_id" }
      )
    if (upsertError) {
      console.error(`  ! ${o.id} upsert failed:`, upsertError.message)
      continue
    }
    console.log(`  ✓ ${o.id}: user=${o.buyer_id} figure=${figureId} HAVE`)
    added++
  }
  console.log(`\nDone. Upserted ${added} row(s).`)
}

main().catch((err) => {
  console.error("FAILED:", err)
  process.exit(1)
})
