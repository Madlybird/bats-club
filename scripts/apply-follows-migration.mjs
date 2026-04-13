// Apply supabase/migrations/002_follows.sql to production Supabase.
//
// Supabase's PostgREST API doesn't accept raw DDL. This script probes a
// few common helper RPCs and prints a clear fallback instruction if
// none are available.
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

const sql = readFileSync("supabase/migrations/002_follows.sql", "utf8")

// 1. First check whether the table already exists. If so, migration is
//    a no-op and we can proceed without touching DDL.
const probe = await supabase.from("follows").select("id").limit(1)
if (!probe.error) {
  console.log("✓ follows table already exists — nothing to do")
  process.exit(0)
}
if (probe.error && !/relation .* does not exist|Could not find the table/i.test(probe.error.message ?? "")) {
  console.error("Unexpected error probing follows table:", probe.error)
  process.exit(1)
}

// 2. Try a few common DDL-through-RPC helper names.
const candidates = ["exec_sql", "execute_sql", "run_sql", "sql"]
for (const fn of candidates) {
  const { error } = await supabase.rpc(fn, { query: sql, sql, statement: sql })
  if (!error) {
    console.log(`✓ applied via rpc('${fn}')`)
    process.exit(0)
  }
  if (!/Could not find the function|function .* does not exist/i.test(error.message ?? "")) {
    console.error(`rpc('${fn}') failed:`, error.message)
  }
}

// 3. No DDL path available — print the SQL and instructions.
console.log()
console.log("─".repeat(72))
console.log("Cannot apply DDL through the Supabase REST API from this")
console.log("environment (no DATABASE_URL, no exec_sql RPC).")
console.log()
console.log("Paste the following into the Supabase Dashboard SQL Editor:")
console.log("  https://supabase.com/dashboard/project/rnlnnunmzikpysstsywx/sql/new")
console.log("─".repeat(72))
console.log()
console.log(sql)
console.log("─".repeat(72))
process.exit(2)
