-- 008_security_hardening.sql
--
-- Makes Stripe webhook order creation idempotent at the DATABASE level.
--
-- The webhook handler guards against duplicate processing with a
-- SELECT-then-INSERT, but that check is not atomic: Stripe can deliver
-- the same event concurrently (at-least-once delivery + retries), and
-- two deliveries can both pass the "no orders yet" check and both
-- insert. This unique index makes the second insert fail with 23505,
-- which the handler now treats as "already processed" instead of
-- creating a duplicate order / double-decrementing stock.
--
-- One order row per (session, listing). NULL session ids (legacy/manual
-- rows) are excluded so they don't collide.

CREATE UNIQUE INDEX IF NOT EXISTS orders_session_listing_uniq
  ON orders (stripe_session_id, listing_id)
  WHERE stripe_session_id IS NOT NULL;
