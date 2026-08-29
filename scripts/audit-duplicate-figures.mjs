// Read-only. Finds `figures` rows that look like duplicates of each other
// (same normalized name + series, distinct ids), which produce thin
// near-duplicate /figures/<slug> archive pages. NOT safe to auto-delete:
// a blind-box / one-coin product line often reuses one generic `name`
// across genuinely different characters — check `character` + photos
// before merging anything. This just surfaces the candidates.
//
//   node scripts/audit-duplicate-figures.mjs
import { createClient } from "@supabase/supabase-js"
import fs from "fs"

for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/)
  if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, "")
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY)

const { data: figures, error } = await supabase
  .from("figures")
  .select("id, slug, name, series, character, manufacturer, created_at")
  .order("created_at", { ascending: false })
if (error) throw error

const norm = (s) => (s || "").toLowerCase().replace(/\([^)]*\)/g, "").replace(/[^a-z0-9]+/g, "")

// active-listing lookup so we can tell which dup rows still matter for the
// shop (their archive page now canonicals to /shop, so they're lower risk)
const { data: listings } = await supabase.from("listings").select("figure_id").eq("active", true)
const hasListing = new Set((listings || []).map((l) => l.figure_id))

const groups = new Map()
for (const f of figures) {
  const key = norm(f.name) + "|" + norm(f.series)
  if (!groups.has(key)) groups.set(key, [])
  groups.get(key).push(f)
}
const dups = [...groups.values()].filter((g) => g.length > 1).sort((a, b) => b.length - a.length)

console.log(`total figures:        ${figures.length}`)
console.log(`duplicate-name groups: ${dups.length}  (${dups.reduce((n, g) => n + g.length, 0)} rows)`)
console.log()
for (const g of dups) {
  const anyListed = g.some((f) => hasListing.has(f.id))
  console.log(`"${g[0].name}" / "${g[0].series}"  —  ${g.length} rows${anyListed ? "  [has active listing]" : "  [archive-only]"}`)
  for (const f of g) {
    console.log(
      `   ${f.id}  char=${JSON.stringify(f.character)}  slug=${JSON.stringify(f.slug)}${hasListing.has(f.id) ? "  *listed*" : ""}`,
    )
  }
}
