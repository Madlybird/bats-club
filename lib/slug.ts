// URL-safe slug generator used for /figures/[slug] paths.
// Must match the backfill logic in supabase/migrations/004_figure_slugs.sql.
import { supabaseAdmin } from "./supabase"

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export function isUuid(input: string): boolean {
  return UUID_RE.test(input)
}

// Returns the slug for a given figure id, or null if the slug column does not
// exist yet, the row is missing, or the slug value is null. Tolerates missing
// column so figure pages keep rendering before the migration is applied.
export async function lookupSlugById(id: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("figures")
    .select("slug")
    .eq("id", id)
    .maybeSingle()
  if (error) return null
  return ((data as any)?.slug as string | null | undefined) || null
}

// Resolves a slug to a figure id. Returns null if the column does not exist.
export async function lookupIdBySlug(slug: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("figures")
    .select("id")
    .eq("slug", slug)
    .maybeSingle()
  if (error) return null
  return ((data as any)?.id as string | null | undefined) || null
}

// Insert a figure row, tolerating a missing slug column. When the column
// exists, computes a unique slug and retries on unique-violation. When it
// does not exist (pre-migration state), inserts without slug.
export async function insertFigureWithSlug(
  base: Record<string, unknown>,
  name: string,
  selectCols: string,
): Promise<{ data: any; error: any }> {
  const baseSlug = slugify(name) || "figure"

  const { data: taken } = await supabaseAdmin
    .from("figures")
    .select("slug")
    .or(`slug.eq.${baseSlug},slug.like.${baseSlug}-%`)

  // If the probe errored because slug column is missing, fall back to a
  // column-less insert. `taken` is null only when no rows match or on error;
  // we can tell apart by re-checking column existence cheaply.
  let slugAvailable = true
  if (!taken) {
    const { error: probeErr } = await supabaseAdmin
      .from("figures")
      .select("slug")
      .limit(1)
    slugAvailable = !probeErr
  }

  if (!slugAvailable) {
    return supabaseAdmin
      .from("figures")
      .insert(base)
      .select(selectCols.replace(/,\s*slug\b/g, "").replace(/\bslug\s*,\s*/g, ""))
      .single()
  }

  const used = new Set(((taken || []) as any[]).map((r) => r.slug as string))
  let slug = baseSlug
  if (used.has(slug)) {
    for (let i = 1; i < 10000; i++) {
      const candidate = `${baseSlug}-${i}`
      if (!used.has(candidate)) { slug = candidate; break }
    }
  }
  return supabaseAdmin
    .from("figures")
    .insert({ ...base, slug })
    .select(selectCols)
    .single()
}
