-- ── Books section (/books) ───────────────────────────────────────────────────
-- Second-hand printed matter from the owner's collection: artbooks,
-- photobooks, zines by other artists, magazines and art/collectible cards.
-- SINBIOX's own zines/postcards stay in `art`.
--
-- Same pattern as 010_art.sql: the item lives in its own table and the
-- sellable unit is a `listings` row with `book_id` set, so cart / Stripe /
-- orders / emails keep working. decrement_stock() already de-lists a sold-out
-- listing whose art_id IS NULL, which is the right rule for 1-of-1 books.

CREATE TABLE IF NOT EXISTS public.books (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title            TEXT NOT NULL,
  title_original   TEXT,                       -- e.g. Japanese title
  type             TEXT NOT NULL,              -- Artbook | Photobook | Zine | Magazine | Cards
  author           TEXT,                       -- artist / author / photographer
  publisher        TEXT,
  year             INTEGER,
  language         TEXT,                       -- free text: "Japanese", "English", "JP/EN"
  isbn             TEXT,
  series           TEXT,                       -- franchise/series for cross-sell with figures/art
  pages            INTEGER,
  size             TEXT,                       -- free text, e.g. "A4 · 297 × 210 mm"
  binding          TEXT,                       -- Hardcover | Softcover | Staple | Box set | …
  includes         TEXT,                       -- comma list: Obi, Dust jacket, Slipcase, Shrinkwrap, Extras
  weight_g         INTEGER NOT NULL CHECK (weight_g > 0 AND weight_g <= 20000),
  description      TEXT,
  description_ru   TEXT,
  description_jp   TEXT,
  is_mature        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS book_id TEXT REFERENCES public.books(id);

-- Exactly one target: figure, art or book. Existing rows already satisfy it.
ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_one_target;
ALTER TABLE public.listings
  ADD CONSTRAINT listings_one_target
  CHECK (num_nonnulls(figure_id, art_id, book_id) = 1);

CREATE INDEX IF NOT EXISTS listings_book_id_idx ON public.listings (book_id);

-- Mirror figures/art RLS: publicly readable, writes only via the service key.
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "books_public_read" ON public.books;
CREATE POLICY "books_public_read" ON public.books FOR SELECT USING (true);

-- Public-read storage bucket for book photos (uploads only via service key).
INSERT INTO storage.buckets (id, name, public)
VALUES ('books', 'books', TRUE)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "books_bucket_public_read" ON storage.objects;
CREATE POLICY "books_bucket_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'books');
