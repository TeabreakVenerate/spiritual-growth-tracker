-- Spiritual Growth Tracker: PostgreSQL Database Schema
-- Run this in your Supabase SQL Editor

create table if not exists public.spiritual_logs (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  date date not null default current_date,
  bible_chapters text not null default 'None',
  prayer_minutes integer not null default 0,
  prayer_focus text default '',
  journal_entry text default '',
  lesson_learned text default '',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for fast user and date lookups
create index if not exists idx_spiritual_logs_user_date on public.spiritual_logs(user_id, date desc);

-- Enable Row Level Security (RLS)
alter table public.spiritual_logs enable row level security;

-- Policies for anon access (or service role)
create policy "Allow read access to spiritual logs"
  on public.spiritual_logs for select
  using (true);

create policy "Allow insert access to spiritual logs"
  on public.spiritual_logs for insert
  with check (true);
