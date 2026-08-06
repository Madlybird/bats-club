-- Adds the 18+ flag used to blur previews/galleries behind an age-gate
-- on both /shop and /archive (both read from public.figures).
-- Run this ONCE in the Supabase SQL Editor:
--
--   https://supabase.com/dashboard/project/rnlnnunmzikpysstsywx/sql/new

ALTER TABLE public.figures
  ADD COLUMN IF NOT EXISTS is_mature BOOLEAN NOT NULL DEFAULT FALSE;
