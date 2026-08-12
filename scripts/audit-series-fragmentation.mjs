import { createClient } from "@supabase/supabase-js"
import fs from "fs"
for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/)
  if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, "")
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY)

const { data: figures, error } = await supabase.from("figures").select("id, name, series")
if (error) throw error
console.log("total figures:", figures.length)

// Normalize aggressively: lowercase, strip punctuation/parens/whitespace,
// to find likely-duplicate series strings.
function norm(s) {
  return s
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")       // drop parenthetical (JP titles etc)
    .replace(/[^a-z0-9]+/g, "")      // strip all punctuation/spaces
    .trim()
}

const groups = {}
for (const f of figures) {
  const key = norm(f.series)
  if (!groups[key]) groups[key] = new Set()
  groups[key].add(f.series)
}

const fragmented = Object.entries(groups).filter(([k, variants]) => variants.size > 1)
console.log(`\n${fragmented.length} normalized groups have >1 exact series string:\n`)
for (const [key, variants] of fragmented) {
  const counts = [...variants].map(v => {
    const c = figures.filter(f => f.series === v).length
    return `"${v}"(${c})`
  })
  console.log(counts.join("  +  "), "  = total", figures.filter(f => norm(f.series) === key).length)
}
