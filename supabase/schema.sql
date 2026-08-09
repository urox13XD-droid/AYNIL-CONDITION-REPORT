-- AYNIL Condition Report — shared session storage
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query).
-- Safe to re-run: every statement is idempotent.

create table if not exists condition_sessions (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '60 days')
);

alter table condition_sessions enable row level security;

-- RLS policies only take effect on top of a baseline table grant — without
-- this, Postgres rejects every request from the anon key with a flat
-- "permission denied for table" before it even reaches the policies below.
grant select, insert, update on condition_sessions to anon;

-- No login system in this app: knowing (or guessing) the session name is what
-- grants access, the same trust model as a shared document link. Anyone with
-- the public anon key can read/write any session row.
drop policy if exists "anon can read sessions" on condition_sessions;
create policy "anon can read sessions" on condition_sessions
  for select to anon using (true);

drop policy if exists "anon can insert sessions" on condition_sessions;
create policy "anon can insert sessions" on condition_sessions
  for insert to anon with check (true);

drop policy if exists "anon can update sessions" on condition_sessions;
create policy "anon can update sessions" on condition_sessions
  for update to anon using (true) with check (true);

-- keep updated_at / expires_at fresh automatically on every write, so the
-- client only ever has to send `id` and `data`
create or replace function touch_condition_session()
returns trigger as $$
begin
  new.updated_at := now();
  new.expires_at := now() + interval '60 days';
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_touch_condition_session on condition_sessions;
create trigger trg_touch_condition_session
  before insert or update on condition_sessions
  for each row execute function touch_condition_session();

-- realtime: broadcast row changes to subscribed clients
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'condition_sessions'
  ) then
    alter publication supabase_realtime add table condition_sessions;
  end if;
end $$;

-- daily purge of sessions inactive for 60+ days
create extension if not exists pg_cron with schema extensions;

select cron.unschedule('purge-expired-condition-sessions')
where exists (select 1 from cron.job where jobname = 'purge-expired-condition-sessions');

select cron.schedule(
  'purge-expired-condition-sessions',
  '17 3 * * *', -- 03:17 UTC daily
  $$ delete from condition_sessions where expires_at < now(); $$
);
