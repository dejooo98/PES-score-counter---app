-- PES League Manager shared storage schema for Supabase
-- Run this once in Supabase SQL Editor.

create table if not exists public.pes_leagues (
  league_id text primary key,
  state_json jsonb not null,
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists pes_leagues_touch_updated_at on public.pes_leagues;
create trigger pes_leagues_touch_updated_at
before update on public.pes_leagues
for each row
execute function public.touch_updated_at();

alter table public.pes_leagues enable row level security;

-- Public read/write with anon key (simple team usage model).
-- For stricter production security, add auth and policies per user/team.
drop policy if exists "pes_leagues_public_read" on public.pes_leagues;
create policy "pes_leagues_public_read"
on public.pes_leagues
for select
to anon
using (true);

drop policy if exists "pes_leagues_public_insert" on public.pes_leagues;
create policy "pes_leagues_public_insert"
on public.pes_leagues
for insert
to anon
with check (true);

drop policy if exists "pes_leagues_public_update" on public.pes_leagues;
create policy "pes_leagues_public_update"
on public.pes_leagues
for update
to anon
using (true)
with check (true);
