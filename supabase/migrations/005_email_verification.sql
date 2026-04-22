-- Adds email_verified flag + verification_tokens table required by
-- /api/auth/register and /api/auth/verify. Idempotent — safe to re-run.

-- 1. users.email_verified
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. verification_tokens
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

ALTER TABLE public.verification_tokens ENABLE ROW LEVEL SECURITY;

-- Force PostgREST to reload its schema cache so the new column/table
-- are visible immediately (otherwise you get PGRST204 until next restart).
NOTIFY pgrst, 'reload schema';
