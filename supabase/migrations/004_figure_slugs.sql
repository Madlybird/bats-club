-- Adds a URL-safe `slug` column to figures and backfills it from name.
-- Run this ONCE in the Supabase SQL Editor BEFORE deploying the
-- /figures/[slug] route change, or slug lookups will 404.

CREATE EXTENSION IF NOT EXISTS unaccent;

ALTER TABLE public.figures ADD COLUMN IF NOT EXISTS slug TEXT;

-- 1. Generate base slug from name for any row without one.
UPDATE public.figures
SET slug = TRIM(
  BOTH '-' FROM
  REGEXP_REPLACE(LOWER(unaccent(name)), '[^a-z0-9]+', '-', 'g')
)
WHERE slug IS NULL OR slug = '';

-- 2. Disambiguate collisions deterministically by creation order.
WITH numbered AS (
  SELECT id, slug,
         ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at, id) AS rn
  FROM public.figures
)
UPDATE public.figures f
SET slug = numbered.slug || '-' || (numbered.rn - 1)
FROM numbered
WHERE f.id = numbered.id AND numbered.rn > 1;

-- 3. Enforce uniqueness + non-nullability now that backfill is done.
CREATE UNIQUE INDEX IF NOT EXISTS figures_slug_unique_idx ON public.figures(slug);
ALTER TABLE public.figures ALTER COLUMN slug SET NOT NULL;
