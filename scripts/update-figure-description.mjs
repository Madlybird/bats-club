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

const identifier = "df58220b-539a-4406-93e7-801a83750b08"
const newDescription =
  "A trading-style vignette figure of Setazakura Tetora crouched on a pink base, drinking milk from a bowl alongside a black cat. Book&box are not included."

const { data: byId } = await supabase
  .from("figures")
  .select("id, slug, name, description")
  .eq("id", identifier)
  .maybeSingle()

let target = byId
if (!target) {
  const { data: bySlug } = await supabase
    .from("figures")
    .select("id, slug, name, description")
    .eq("slug", identifier)
    .maybeSingle()
  target = bySlug
}

if (!target) {
  console.error("Figure not found by id or slug:", identifier)
  process.exit(1)
}

console.log("Found:", { id: target.id, slug: target.slug, name: target.name })
console.log("Old description:", target.description)

const { data: updated, error: updateError } = await supabase
  .from("figures")
  .update({ description: newDescription })
  .eq("id", target.id)
  .select("id, slug, name, description")
  .single()

if (updateError) {
  console.error("Update error:", updateError)
  process.exit(1)
}

console.log("New description:", updated.description)
console.log("Done.")
