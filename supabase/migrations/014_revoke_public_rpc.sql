-- ── Server-only RPCs: revoke the default PUBLIC execute grant ────────────────
-- Postgres grants EXECUTE on new functions to PUBLIC, and 011's
-- `REVOKE ... FROM anon, authenticated` doesn't remove that grant, so the
-- publishable (anon) key could still call these over PostgREST. They run as
-- SECURITY INVOKER, so listings/articles RLS already made those calls no-ops
-- (verified 2026-10-03); this closes the door itself.
--
-- Only the server (service_role: Stripe webhook, /api/article-views) calls
-- them, so service_role is granted explicitly before PUBLIC is revoked.

GRANT EXECUTE ON FUNCTION public.decrement_stock(text, integer) TO service_role;
REVOKE EXECUTE ON FUNCTION public.decrement_stock(text, integer) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.increment_article_views(text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.increment_article_views(text) FROM PUBLIC, anon, authenticated;
