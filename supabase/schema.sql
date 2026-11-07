-- Run in Supabase Dashboard -> SQL Editor before deploying ClassNest.
-- Rows are restricted to the signed-in user's Supabase Auth ID.

create table if not exists public.lessons (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  date date not null,
  topic text not null check (length(trim(topic)) between 1 and 220),
  start_time text not null,
  end_time text not null,
  hourly_rate numeric(12, 2) not null check (hourly_rate >= 0),
  paid boolean not null default false,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  primary key (user_id, id)
);

create table if not exists public.preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  default_rate numeric(12, 2) not null default 50 check (default_rate >= 0)
);

create index if not exists lessons_user_date_idx
  on public.lessons (user_id, date desc);

alter table public.lessons enable row level security;
alter table public.preferences enable row level security;

revoke all on public.lessons from anon, authenticated;
revoke all on public.preferences from anon, authenticated;
grant select, insert, update, delete on public.lessons to authenticated;
grant select, insert, update, delete on public.preferences to authenticated;

create policy "Read own lessons" on public.lessons
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own lessons" on public.lessons
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own lessons" on public.lessons
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Delete own lessons" on public.lessons
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Read own preferences" on public.preferences
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own preferences" on public.preferences
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own preferences" on public.preferences
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Delete own preferences" on public.preferences
  for delete to authenticated using ((select auth.uid()) = user_id);
