// Parses a shop price-range filter value of the form "min-max" (cents),
// both bounds inclusive, where an empty max means no upper bound (e.g.
// "10001-" = $100.01+). Returns null for anything malformed so callers
// can just skip filtering.
export function parsePriceRange(value?: string): { min: number; max?: number } | null {
  if (!value) return null
  const match = value.match(/^(\d+)-(\d*)$/)
  if (!match) return null
  const min = Number(match[1])
  const max = match[2] === "" ? undefined : Number(match[2])
  return { min, max }
}
