-- ── Atomic stock decrement ──────────────────────────────────────────────────
-- Replaces the read-then-write in the Stripe webhook's decrementStock(). Two
-- concurrent paid checkouts for the same listing could both read the old stock
-- and both write a too-high value, overselling (up to `quantity`; a latent
-- double-sell on 1-of-1 figures). This does it in one statement.
--
-- Returns the new stock, or NULL when there wasn't enough stock at the moment
-- the payment settled — the payment already succeeded, so the caller keeps the
-- order and logs an oversold alert for a manual refund / restock.
--
-- `p_listing_id` is text and compared as `id::text` so it works whether
-- listings.id is a uuid or text column. The table is small; the cast is free.

CREATE OR REPLACE FUNCTION public.decrement_stock(p_listing_id text, p_qty integer)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_stock integer;
BEGIN
  UPDATE public.listings
  SET stock  = stock - p_qty,
      active = CASE
                 WHEN stock - p_qty <= 0 AND art_id IS NULL THEN false
                 ELSE active
               END
  WHERE id::text = p_listing_id
    AND stock >= p_qty
  RETURNING stock INTO v_new_stock;

  RETURN v_new_stock;  -- NULL when the row didn't match (not enough stock)
END;
$$;

-- Only the service role (webhook / server) ever calls this.
REVOKE ALL ON FUNCTION public.decrement_stock(text, integer) FROM anon, authenticated;
