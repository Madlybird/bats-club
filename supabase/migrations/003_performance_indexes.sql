-- Performance indexes for homepage / archive / figure detail queries.
-- Postgres does not auto-create FK indexes, and the existing schema
-- has none on the join columns used by our figure joins, nor on the
-- sort/filter columns used by order/where clauses.
--
-- Apply in the Supabase SQL editor. Safe to run multiple times.

CREATE INDEX IF NOT EXISTS figures_created_at_idx   ON public.figures (created_at DESC);
CREATE INDEX IF NOT EXISTS figures_series_idx       ON public.figures (series);
CREATE INDEX IF NOT EXISTS figures_manufacturer_idx ON public.figures (manufacturer);

CREATE INDEX IF NOT EXISTS listings_figure_id_idx   ON public.listings (figure_id);
CREATE INDEX IF NOT EXISTS listings_active_idx      ON public.listings (active) WHERE active = TRUE;

CREATE INDEX IF NOT EXISTS user_figures_figure_id_idx ON public.user_figures (figure_id);

CREATE INDEX IF NOT EXISTS article_figures_figure_id_idx ON public.article_figures (figure_id);
