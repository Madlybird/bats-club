-- Follow/unfollow system
-- Run this in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS public.follows (
  id           UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id  TEXT         REFERENCES public.users(id) ON DELETE CASCADE,
  following_id TEXT         REFERENCES public.users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS follows_following_idx ON public.follows (following_id);
CREATE INDEX IF NOT EXISTS follows_follower_idx  ON public.follows (follower_id);
