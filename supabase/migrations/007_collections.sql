-- Curated homepage collections (albums) e.g. "Di Gi Charat", "Evangelion".
-- Run this ONCE in the Supabase SQL Editor BEFORE the homepage redesign
-- deploy is expected to render collections. The homepage tolerates the
-- tables being absent (renders zero collections) so deploy order is safe.
--
--   https://supabase.com/dashboard/project/rnlnnunmzikpysstsywx/sql/new

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.collections (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  slug       TEXT UNIQUE NOT NULL,
  name_en    TEXT NOT NULL,
  name_ru    TEXT,
  name_jp    TEXT,
  cover_url  TEXT,
  position   INT  NOT NULL DEFAULT 0,
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.collection_figures (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  collection_id TEXT NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  figure_id     TEXT NOT NULL REFERENCES public.figures(id) ON DELETE CASCADE,
  position      INT  NOT NULL DEFAULT 0,
  UNIQUE (collection_id, figure_id)
);

CREATE INDEX IF NOT EXISTS collection_figures_collection_idx
  ON public.collection_figures(collection_id);
CREATE INDEX IF NOT EXISTS collections_active_position_idx
  ON public.collections(active, position);
