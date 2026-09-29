-- Manually awarded stamp-card stamps, e.g. for purchases made outside the
-- site (DM / in person) that never became a PAID order row. Added on top of
-- the PAID-order count in lib/profile.ts.
alter table public.users
  add column if not exists bonus_stamps integer not null default 0
  check (bonus_stamps >= 0);
