-- Spiritual Growth Tracker: PostgreSQL Database Schema (Multi-Tenant)

-- Create ENUM type for roles
create type public.user_role as enum ('member', 'admin');

-- Users Table
create table if not exists public.users (
  id bigint primary key, -- Telegram user ID
  first_name text,
  username text,
  role public.user_role default 'member',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Spiritual Logs Table
drop table if exists public.spiritual_logs cascade;
create table public.spiritual_logs (
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
alter table public.spiritual_logs enable row level security;
alter table public.auth_tokens enable row level security;

-- Policies for anon/authenticated access
create policy "Allow token-authenticated read access to users" 
  on public.users for select using (true);

create policy "Allow token-authenticated read access to logs" 
  on public.spiritual_logs for select using (true);

create policy "Allow service role operations on users" 
  on public.users using (true) with check (true);

create policy "Allow service role operations on logs" 
  on public.spiritual_logs using (true) with check (true);

create policy "Allow service role operations on auth_tokens" 
  on public.auth_tokens using (true) with check (true);
