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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const figureId = "df58220b-539a-4406-93e7-801a83750b08"
const newYear = 2004

const { data: before } = await supabase
  .from("figures")
  .select("id, slug, name, year")
  .eq("id", figureId)
  .maybeSingle()

if (!before) {
  console.error("Figure not found:", figureId)
  process.exit(1)
}

console.log("Before:", before)

const { data: after, error } = await supabase
  .from("figures")
  .update({ year: newYear })
  .eq("id", figureId)
  .select("id, slug, name, year")
  .single()

if (error) {
  console.error("Update error:", error)
  process.exit(1)
}

console.log("After:", after)
