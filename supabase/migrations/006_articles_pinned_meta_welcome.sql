-- Adds the `pinned` + `meta_description` columns, then seeds the
-- "Welcome to Bats Club" article pinned to the top. Idempotent — a
-- re-run just updates the existing welcome article in place.

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS meta_description TEXT;

CREATE INDEX IF NOT EXISTS articles_pinned_created_at_idx
  ON public.articles (pinned DESC, created_at DESC);

-- Seed the welcome article, authored by the earliest admin account so
-- the FK to users resolves. ON CONFLICT on slug so re-runs update.
INSERT INTO public.articles (
  title, slug, body, excerpt, meta_description, cover_image,
  author_id, published, pinned, created_at, updated_at
)
SELECT
  'Welcome to Bats Club',
  'welcome-to-bats-club',
  $body$Bats Club is an open private archive of rare vintage anime figures from the 90s and early 2000s. Di Gi Charat, Evangelion, Strawberry Marshmallow, Range Murata, Shirow Masamune. Early Kaiyodo and pre-consolidation Good Smile. Wonder Festival pieces, magazine inserts, prize lines, gashapon. Figures that shaped an entire collector culture, and that get harder to find in real condition with every year.

## Digital Digging Experience

Any collector knows the feeling of hunting for a figure and hitting a wall. The references don't exist. The sculptor's name is a dead end. Most of what's online is one blurry photo and a dead link. From physical shops to digital ones, there is always data missing, and most of it was never written down in the first place.

Bats Club is built to be the place where that stops happening. The archive holds the best selection of vintage figures from the era together with the context around them: series, year, manufacturer, sculptor where the credit can be traced, production run, variant. You dig through otaku history the same way you dig through your own memory — by series you loved, by years that mattered, by the names of people whose work kept coming back to you across different projects. One figure opens onto the next. A variant you didn't know existed. A release date that finally explains why two pieces you own don't quite match. Half an hour in, you've opened fifteen figures and forgotten what you came looking for.

Mark what you already have. Add what you want next to your wishlist. Shape your own collector profile as you go. Keeping your collection inside the archive matters as much as keeping it on the shelf. It's how you track what you own from anywhere, and it's how you decide, with real information in front of you, which figure becomes the next one you bring home.

## Your Profile

Add your own figures to a collector profile, and the archive grows with you. Your shelves, your digs, your notes, sitting inside the record next to everything else. By adding the pieces you own and the ones you're hunting, you can share your collection with other collectors and across social media, and see your collection scored against the archive itself.

## The Wishlist

Every figure in the archive exists within Bats Club reach. We're collectors too, and we understand how much it matters to chase a specific piece for years. The more wishlists a figure accumulates, the closer it moves to being released from the archive and opened for purchase. So the pieces that come out next are the ones the community is actually hunting for.

## The Stamps

The stamps come from the feeling of walking through Akihabara. The small Tokyo shops, the handwritten tags, the ink marks that tell you a person picked this piece and put it in the box for you. Every figure that ships from Bats Club carries them. And they come with perks.

Bats Club is where you find the rarest figures in the world, share the hunt with a community of collectors, and become a true collector yourself.$body$,
  'Bats Club is an open private archive of rare vintage anime figures from the 90s and 2000s. Dig through the archive, build your profile, wishlist rare pieces to unlock them for the community.',
  'Bats Club is an open private archive of rare vintage anime figures from the 90s and 2000s. Dig through the archive, build your profile, wishlist rare pieces to unlock them for the community.',
  'https://i.postimg.cc/8zNdXYnb/photo-2026-02-19-18-43-14.jpg',
  u.id,
  TRUE,
  TRUE,
  NOW(),
  NOW()
FROM public.users u
WHERE u.is_admin = TRUE
ORDER BY u.created_at ASC
LIMIT 1
ON CONFLICT (slug) DO UPDATE SET
  title            = EXCLUDED.title,
  body             = EXCLUDED.body,
  excerpt          = EXCLUDED.excerpt,
  meta_description = EXCLUDED.meta_description,
  cover_image      = EXCLUDED.cover_image,
  published        = EXCLUDED.published,
  pinned           = EXCLUDED.pinned,
  updated_at       = NOW();

NOTIFY pgrst, 'reload schema';
