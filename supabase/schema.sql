-- Run this once in the Supabase SQL editor for your project.
-- RLS is left disabled on purpose: the app only ever talks to Supabase
-- through the service-role key on the server (never from the browser),
-- so there is no anon/public access path that RLS would need to restrict.

create extension if not exists pgcrypto;

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  messages jsonb not null default '[]'::jsonb,
  business_type text,
  pain text,
  track_slugs text[] not null default '{}'
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text,
  phone text,
  email text,
  business_type text,
  pain text,
  track_slug text,
  gender text,
  age int,
  status text not null default 'new',
  notes text,
  conversation_id uuid references conversations(id) on delete set null
);

create index if not exists leads_created_at_idx on leads (created_at desc);
create index if not exists conversations_updated_at_idx on conversations (updated_at desc);
