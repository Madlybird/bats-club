-- Add locale-specific description columns to figures table
-- Run this in the Supabase SQL editor if these columns don't exist yet

ALTER TABLE public.figures
  ADD COLUMN IF NOT EXISTS description_ru TEXT,
  ADD COLUMN IF NOT EXISTS description_jp TEXT;
