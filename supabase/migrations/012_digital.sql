-- ── Digital art downloads ───────────────────────────────────────────────────
-- An art piece can be a downloadable PDF instead of a physical item. The
-- sellable unit is still a `listings` row (price); `is_digital` + `file_path`
-- live on the `art` row. Digital pieces have no shipping and unlimited stock.
--
-- After payment the Stripe webhook mints a random token, writes a
-- `digital_downloads` row (7-day expiry) and emails the buyer a link to
-- /api/download/<token>, which streams the PDF from the private `art-files`
-- bucket via a short-lived signed URL.

ALTER TABLE public.art ADD COLUMN IF NOT EXISTS is_digital BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.art ADD COLUMN IF NOT EXISTS file_path TEXT;  -- key within the art-files bucket
ALTER TABLE public.art ADD COLUMN IF NOT EXISTS file_name TEXT;  -- original filename for the download

CREATE TABLE IF NOT EXISTS public.digital_downloads (
  token          TEXT PRIMARY KEY,
  order_id       TEXT NOT NULL,
  listing_id     TEXT NOT NULL,
  file_path      TEXT NOT NULL,
  file_name      TEXT,
  download_count INTEGER NOT NULL DEFAULT 0,
  expires_at     TIMESTAMPTZ NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS digital_downloads_order_id_idx ON public.digital_downloads (order_id);

-- Server-only: RLS enabled with no policies → denied to anon/authenticated,
-- reachable only via the service key (webhook + /api/download route). Mirrors
-- how `orders` / `users` are locked down.
ALTER TABLE public.digital_downloads ENABLE ROW LEVEL SECURITY;

-- Private bucket for the deliverable files — NO public-read policy, so the raw
-- PDFs are only reachable through the tokened /api/download route (which uses
-- the service key to sign a 60-second URL per click).
INSERT INTO storage.buckets (id, name, public)
VALUES ('art-files', 'art-files', FALSE)
ON CONFLICT (id) DO NOTHING;
