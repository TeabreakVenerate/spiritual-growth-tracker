-- Spiritual Growth Tracker: PostgreSQL Database Schema (Idempotent)

-- Create ENUM type for roles safely if it does not already exist
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('member', 'admin');
  end if;
end $$;

-- Users Table
create table if not exists public.users (
  id bigint primary key, -- Telegram user ID
  first_name text,
  username text,
  role public.user_role default 'member',
  pending_action text, -- Tracks multi-step button interactions across serverless invocations
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure pending_action column exists if table is already present
alter table public.users add column if not exists pending_action text;

-- Daily Devotions Table (Scorecard Format)
create table if not exists public.daily_devotions (
  id uuid default gen_random_uuid() primary key,
  user_id bigint not null references public.users(id) on delete cascade,
  log_date date default current_date not null,
  prayer_check boolean default false not null,
  bible_check boolean default false not null,
  weekly_track text default '' not null,
  book_page text default '' not null,
  ai_feedback text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, log_date)
);

create index if not exists idx_daily_devotions_user_date on public.daily_devotions(user_id, log_date desc);

-- Legacy/Detailed Spiritual Logs Table (Optional / Secondary Ingestion)
create table if not exists public.spiritual_logs (
  id uuid default gen_random_uuid() primary key,
  user_id bigint not null references public.users(id) on delete cascade,
  category text not null check (category in ('biblestudy', 'prayer', 'sermon', 'book')),
  duration_minutes integer,
  content text not null,
  takeaway text,
  ai_feedback text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_spiritual_logs_user_date on public.spiritual_logs(user_id, created_at desc);

-- Auth Tokens Table (Magic Links)
create table if not exists public.auth_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id bigint not null references public.users(id) on delete cascade,
  token text unique not null,
  expires_at timestamp with time zone not null,
  used boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.daily_devotions enable row level security;
alter table public.spiritual_logs enable row level security;
alter table public.auth_tokens enable row level security;

-- Policies for anon/authenticated read access (safely dropped then recreated)
drop policy if exists "Allow token-authenticated read access to users" on public.users;
create policy "Allow token-authenticated read access to users" 
  on public.users for select using (true);

drop policy if exists "Allow token-authenticated read access to daily_devotions" on public.daily_devotions;
create policy "Allow token-authenticated read access to daily_devotions" 
  on public.daily_devotions for select using (true);

drop policy if exists "Allow token-authenticated read access to logs" on public.spiritual_logs;
create policy "Allow token-authenticated read access to logs" 
  on public.spiritual_logs for select using (true);

-- Policies for service role operations
drop policy if exists "Allow service role operations on users" on public.users;
create policy "Allow service role operations on users" 
  on public.users using (true) with check (true);

drop policy if exists "Allow service role operations on daily_devotions" on public.daily_devotions;
create policy "Allow service role operations on daily_devotions" 
  on public.daily_devotions using (true) with check (true);

drop policy if exists "Allow service role operations on logs" on public.spiritual_logs;
create policy "Allow service role operations on logs" 
  on public.spiritual_logs using (true) with check (true);

drop policy if exists "Allow service role operations on auth_tokens" on public.auth_tokens;
create policy "Allow service role operations on auth_tokens" 
  on public.auth_tokens using (true) with check (true);
