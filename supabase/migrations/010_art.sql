-- ── Art section ──────────────────────────────────────────────────────────────
-- Original art by SINBIOX (posters, prints, postcards, stickers, canvas, zines)
-- sold on /art. Deliberately NOT in the `figures` table: art must never appear
-- in /archive, /figures/*, the figure sitemap loop, or the figure Merchant feed.
--
-- The sellable unit reuses the existing `listings` table (price / stock / photos
-- / active) via a new nullable `art_id`, so checkout, orders, Stripe and the
-- confirmation email keep working unchanged. A listing points at exactly one of
-- figure_id / art_id.

CREATE TABLE IF NOT EXISTS public.art (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title          TEXT NOT NULL,
  artist         TEXT NOT NULL DEFAULT 'SINBIOX',
  type           TEXT NOT NULL,              -- Poster | Digital Print | Postcard | Sticker | Canvas | Zine
  series         TEXT,
  year           INTEGER,
  size           TEXT NOT NULL,              -- free text, e.g. "A3 · 297 × 420 mm"
  material       TEXT,
  edition        TEXT,                       -- free text, e.g. "Open", "1/1", "Edition of 50"
  description    TEXT,
  description_ru TEXT,
  description_jp TEXT,
  is_mature      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- listings can now describe an art piece instead of a figure.
ALTER TABLE public.listings ALTER COLUMN figure_id DROP NOT NULL;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS art_id TEXT REFERENCES public.art(id);

-- Exactly one target. Existing rows (figure_id set, art_id null) already satisfy it.
ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_one_target;
ALTER TABLE public.listings
  ADD CONSTRAINT listings_one_target
  CHECK (num_nonnulls(figure_id, art_id) = 1);

CREATE INDEX IF NOT EXISTS listings_art_id_idx ON public.listings (art_id);

-- Mirror figures' RLS: publicly readable, writes only via the service key
-- (telegram bot / server).
ALTER TABLE public.art ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "art_public_read" ON public.art;
CREATE POLICY "art_public_read" ON public.art FOR SELECT USING (true);

-- Public-read storage bucket for art photos, mirroring the `figures` bucket.
INSERT INTO storage.buckets (id, name, public)
VALUES ('art', 'art', TRUE)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "art_bucket_public_read" ON storage.objects;
CREATE POLICY "art_bucket_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'art');
