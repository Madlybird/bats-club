// URL-safe slug generator used for /figures/[slug] paths.
// Must match the backfill logic in supabase/migrations/004_figure_slugs.sql.
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
