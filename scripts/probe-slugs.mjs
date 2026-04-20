// Probe the production Supabase to report on the state of figures.slug.
// Reads .env.local directly so it works without loaders.
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

// 1. Column existence probe: SELECT slug.
const probe = await supabase.from("figures").select("id, slug").limit(1)
if (probe.error) {
  const msg = probe.error.message || ""
  if (/column .* does not exist|column "slug"|slug.*does not exist/i.test(msg)) {
    console.log("✗ slug column does NOT exist — migration not applied")
    process.exit(2)
  }
  console.error("Unexpected error probing slug column:", probe.error)
  process.exit(1)
}

// 2. Totals.
const { count: total } = await supabase
  .from("figures")
  .select("id", { count: "exact", head: true })
const { count: nulls } = await supabase
  .from("figures")
  .select("id", { count: "exact", head: true })
  .is("slug", null)
const { count: empties } = await supabase
  .from("figures")
  .select("id", { count: "exact", head: true })
  .eq("slug", "")

console.log(`✓ slug column exists`)
console.log(`  total figures:    ${total}`)
console.log(`  slug IS NULL:     ${nulls}`)
console.log(`  slug = "":        ${empties}`)
console.log(`  populated:        ${(total ?? 0) - (nulls ?? 0) - (empties ?? 0)}`)

// 3. Show a sample so we can eyeball values.
const { data: sample } = await supabase
  .from("figures")
  .select("id, slug, name")
  .order("created_at", { ascending: false })
  .limit(5)
console.log("  sample:")
for (const row of sample ?? []) {
  console.log(`    ${row.id}  slug=${JSON.stringify(row.slug)}  name=${JSON.stringify(row.name)}`)
}
