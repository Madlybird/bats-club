// Figures that should be suppressed everywhere (archive grid, search,
// detail page, API). The old next.config redirect only covered the
// canonical /figures/<uuid> URL and was bypassable via the text slug
// and the API — this is the single source of truth instead.
export const HIDDEN_FIGURE_IDS = new Set<string>([
  "c36e619e-3a31-45ae-8683-0ff079a2c095",
])

export function isHiddenFigure(id?: string | null): boolean {
  return !!id && HIDDEN_FIGURE_IDS.has(id)
}
