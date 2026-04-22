-- ============================================================
-- Bats Club — Supabase schema
-- Run this in the Supabase SQL editor
-- ============================================================

-- Auto-update trigger helper
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email           TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  username        TEXT UNIQUE NOT NULL,
  password        TEXT NOT NULL,
  avatar          TEXT,
  bio             TEXT,
  is_admin        BOOLEAN DEFAULT FALSE,
  email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Figures ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.figures (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name         TEXT NOT NULL,
  series       TEXT NOT NULL,
  character    TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  scale        TEXT NOT NULL,
  year         INTEGER NOT NULL,
  sculptor     TEXT,
  material     TEXT,
  image_url       TEXT,
  images          JSONB    NOT NULL DEFAULT '[]'::jsonb,
  description     TEXT,
  description_ru  TEXT,
  description_jp  TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── User Figures (collection + wishlist states) ───────────────
CREATE TABLE IF NOT EXISTS public.user_figures (
  id        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id   TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  figure_id TEXT NOT NULL REFERENCES public.figures(id) ON DELETE CASCADE,
  status    TEXT NOT NULL CHECK (status IN ('HAVE', 'WISHLIST', 'BUY')),
  UNIQUE (user_id, figure_id)
);

-- ── Listings ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.listings (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  figure_id   TEXT NOT NULL REFERENCES public.figures(id),
  seller_id   TEXT NOT NULL REFERENCES public.users(id),
  price       INTEGER NOT NULL,
  condition   TEXT NOT NULL,
  stock       INTEGER DEFAULT 1,
  photos      JSONB DEFAULT '[]'::jsonb,
  description TEXT,
  active      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Orders ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  buyer_id         TEXT NOT NULL REFERENCES public.users(id),
  listing_id       TEXT NOT NULL REFERENCES public.listings(id),
  status           TEXT DEFAULT 'PENDING',
  tracking_number  TEXT,
  shipping_address JSONB DEFAULT '{}'::jsonb,
  stripe_session_id TEXT UNIQUE,
  quantity         INTEGER DEFAULT 1,
  unit_price       INTEGER NOT NULL,
  shipping_price   INTEGER DEFAULT 1500,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Articles ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.articles (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title            TEXT NOT NULL,
  slug             TEXT UNIQUE NOT NULL,
  body             TEXT NOT NULL,
  excerpt          TEXT,
  meta_description TEXT,
  cover_image      TEXT,
  author_id        TEXT NOT NULL REFERENCES public.users(id),
  published        BOOLEAN DEFAULT FALSE,
  pinned           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS articles_pinned_created_at_idx
  ON public.articles (pinned DESC, created_at DESC);

CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Password Reset Tokens ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  token      TEXT UNIQUE NOT NULL,
  email      TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Email Verification Tokens ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.verification_tokens (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id    TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, token)
);

CREATE INDEX IF NOT EXISTS verification_tokens_user_id_idx
  ON public.verification_tokens (user_id);

-- ── Article ↔ Figure join ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.article_figures (
  article_id TEXT NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  figure_id  TEXT NOT NULL REFERENCES public.figures(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, figure_id)
);

-- ============================================================
-- Storage bucket (run separately or create via Dashboard)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('figures', 'figures', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: anyone can read public bucket objects
CREATE POLICY "figures_bucket_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'figures');

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE public.users                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.figures               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_figures          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_tokens   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_figures       ENABLE ROW LEVEL SECURITY;

-- Figures: publicly readable
CREATE POLICY "figures_public_read" ON public.figures
  FOR SELECT TO PUBLIC USING (TRUE);

-- Listings: active ones are publicly readable
CREATE POLICY "listings_public_read" ON public.listings
  FOR SELECT TO PUBLIC USING (active = TRUE);

-- Articles: published ones are publicly readable
CREATE POLICY "articles_public_read" ON public.articles
  FOR SELECT TO PUBLIC USING (published = TRUE);

-- Article figures: publicly readable
CREATE POLICY "article_figures_public_read" ON public.article_figures
  FOR SELECT TO PUBLIC USING (TRUE);

-- All writes and private table reads go through the server-side
-- admin client (secret key) which bypasses RLS automatically.
-- No additional policies needed for server-side operations.

-- ── Series views (popularity tracking) ───────────────────────
CREATE TABLE IF NOT EXISTS public.series_views (
  series  TEXT PRIMARY KEY,
  views   BIGINT NOT NULL DEFAULT 0
);

-- Atomic upsert-increment function (called from API route)
CREATE OR REPLACE FUNCTION increment_series_views(p_series TEXT)
RETURNS void AS $$
BEGIN
  INSERT INTO public.series_views (series, views) VALUES (p_series, 1)
  ON CONFLICT (series) DO UPDATE SET views = series_views.views + 1;
END;
$$ LANGUAGE plpgsql;
