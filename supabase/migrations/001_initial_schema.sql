-- ─────────────────────────────────────────────────────────────
-- MULTI Ai — Supabase Migration
-- Run this in Supabase SQL editor or via Supabase CLI:
--   supabase db push
-- ─────────────────────────────────────────────────────────────

-- Enable UUID extension (usually already enabled)
create extension if not exists "uuid-ossp";

-- pgcrypto provides gen_random_uuid() on Postgres < 13
-- On Postgres 13+ it is a safe no-op
create extension if not exists "pgcrypto";

-- ── profiles ─────────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'pro_max')),
  stripe_customer_id text unique,
  subscription_id text,
  subscription_status text not null default 'inactive'
    check (subscription_status in ('active', 'inactive', 'trialing', 'past_due', 'canceled', 'unpaid')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile on new user signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Auto-update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_profiles_updated_at on profiles;
create trigger set_profiles_updated_at
  before update on profiles
  for each row execute procedure update_updated_at_column();

-- ── usage_windows ─────────────────────────────────────────────
create table if not exists usage_windows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  window_start timestamptz not null default now(),
  window_end timestamptz not null,
  query_count int not null default 0 check (query_count >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_usage_windows_user_id on usage_windows(user_id);
create index if not exists idx_usage_windows_window_end on usage_windows(window_end);

-- ── queries ───────────────────────────────────────────────────
create table if not exists queries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  question text not null check (length(question) >= 3 and length(question) <= 8000),
  final_answer text,
  confidence_score numeric check (confidence_score >= 0 and confidence_score <= 100),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'complete', 'error')),
  model_set jsonb,
  source_trail jsonb,
  judge_result jsonb,
  latency_ms int,
  cost_estimate_usd numeric check (cost_estimate_usd >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_queries_user_id on queries(user_id);
create index if not exists idx_queries_created_at on queries(created_at desc);
create index if not exists idx_queries_status on queries(status);

-- ── model_responses ───────────────────────────────────────────
create table if not exists model_responses (
  id uuid primary key default gen_random_uuid(),
  query_id uuid not null references queries(id) on delete cascade,
  provider text not null check (provider in ('openai', 'gemini', 'claude', 'perplexity', 'llama')),
  model text,
  raw_answer text,
  citations jsonb,
  latency_ms int,
  error text,
  token_input int check (token_input >= 0),
  token_output int check (token_output >= 0),
  cost_estimate_usd numeric check (cost_estimate_usd >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_model_responses_query_id on model_responses(query_id);

-- ── feedback ──────────────────────────────────────────────────
create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  query_id uuid not null references queries(id) on delete cascade,
  rating int check (rating >= 1 and rating <= 5),
  comment text check (length(comment) <= 2000),
  created_at timestamptz not null default now(),
  unique(user_id, query_id)
);

create index if not exists idx_feedback_query_id on feedback(query_id);

-- ─────────────────────────────────────────────────────────────
-- Row Level Security (RLS)
-- ─────────────────────────────────────────────────────────────

-- profiles
alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

-- No client-side UPDATE policy on profiles.
-- plan, stripe_customer_id, subscription_id, subscription_status
-- are ALL updated exclusively by server-side service role via
-- Stripe webhooks. RLS is bypassed for service_role automatically.
-- If you add user-editable fields (e.g. display_name) in future,
-- add a targeted policy here that excludes sensitive columns.

-- usage_windows
alter table usage_windows enable row level security;

create policy "Users can view own usage"
  on usage_windows for select
  using (auth.uid() = user_id);

-- queries
alter table queries enable row level security;

create policy "Users can view own queries"
  on queries for select
  using (auth.uid() = user_id);

create policy "Users can insert own queries"
  on queries for insert
  with check (auth.uid() = user_id);

-- model_responses
alter table model_responses enable row level security;

create policy "Users can view model responses for own queries"
  on model_responses for select
  using (
    exists (
      select 1 from queries q
      where q.id = model_responses.query_id
      and q.user_id = auth.uid()
    )
  );

-- feedback
alter table feedback enable row level security;

create policy "Users can view own feedback"
  on feedback for select
  using (auth.uid() = user_id);

create policy "Users can insert own feedback"
  on feedback for insert
  with check (auth.uid() = user_id);
