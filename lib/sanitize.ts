/**
 * Strips characters that have structural meaning inside a PostgREST
 * filter string (used with the supabase-js `.or()` builder, which
 * takes a raw filter expression). Without this, user input can break
 * out of an `ilike` term and inject arbitrary filters / column refs.
 *
 * Removes the grammar delimiters: comma, parentheses, double-quote and
 * backslash. The remaining `%`/`_` are harmless LIKE wildcards.
 */
export function sanitizePostgrestTerm(input: string): string {
  return input.replace(/[,()"\\]/g, "").trim()
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
  return UUID_RE.test(value)
}
