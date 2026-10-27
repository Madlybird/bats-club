-- Session revocation on password change. lib/auth.ts compares a session
-- JWT's iat against this timestamp on every request and drops sessions
-- issued before the last password change (set by /api/auth/reset-password).
-- NULL = never changed. Idempotent — safe to re-run.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;

-- Force PostgREST to reload its schema cache so the column is visible
-- immediately (otherwise PGRST204 until the next restart).
NOTIFY pgrst, 'reload schema';
