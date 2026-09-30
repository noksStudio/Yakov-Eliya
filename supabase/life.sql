-- Personal life OS (/life). Run this once in the Supabase SQL editor, after schema.sql.
-- Like the rest of the app, these tables are only ever read and written on the server
-- with the service-role key. RLS is enabled with no policies, so the public anon key
-- cannot read any of this data even if it leaks.

create extension if not exists pgcrypto;

create table if not exists life_settings (
  id int primary key default 1 check (id = 1),
  wake_time text not null default '06:30',
  shacharit_time text not null default '07:15',
  mincha_time text,
  arvit_time text,
  deep_work_start text not null default '09:00',
  deep_work_end text not null default '11:00',
  day_close_time text not null default '20:45',
  hitbodedut_time text not null default '21:15',
  hitbodedut_minutes int not null default 60,
  screens_off_time text not null default '22:15',
  sleep_time text not null default '22:45',
  shabbat_silence boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists life_tasks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null,
  area text not null default 'general',
  priority int not null default 2,
  due_date date,
  scheduled_time text,
  done boolean not null default false,
  done_at timestamptz,
  source text not null default 'user'
);

create table if not exists life_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  date date not null,
  start_time text not null,
  end_time text,
  title text not null,
  area text not null default 'general',
  source text not null default 'user'
);

create table if not exists life_checkins (
  date date primary key,
  sleep_hours numeric,
  weight numeric,
  energy int,
  mood int,
  shacharit boolean not null default false,
  mincha boolean not null default false,
  arvit boolean not null default false,
  hitbodedut boolean not null default false,
  workout boolean not null default false,
  day_rating int,
  note text,
  updated_at timestamptz not null default now()
);

create table if not exists life_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  agent text not null default 'chief',
  role text not null check (role in ('user', 'assistant')),
  content text not null
);

-- Body plan documents (profile, meal plan, workout plan), rewritten wholesale by the body coach.
create table if not exists life_docs (
  key text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists life_shopping (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null,
  qty text,
  category text not null default 'שונות',
  checked boolean not null default false
);

-- Finance ledger (the finance manager) and sales pipeline + daily outreach (the business manager).
create table if not exists life_finance (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  date date not null,
  kind text not null check (kind in ('income', 'expense')),
  amount numeric not null check (amount > 0),
  category text not null,
  scope text not null default 'business' check (scope in ('business', 'personal')),
  note text
);

create table if not exists life_deals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  contact text,
  stage text not null default 'lead',
  value numeric,
  next_action text,
  next_date date,
  notes text
);

create table if not exists life_activity (
  date date primary key,
  connections int not null default 0,
  followups int not null default 0,
  calls int not null default 0,
  meetings int not null default 0
);

-- Personal writing: the hitbodedut journal (always private, never sent to an agent) and daily
-- reflections (readable by the mental coach unless marked private).
create table if not exists life_journal (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  date date not null,
  kind text not null check (kind in ('hitbodedut', 'reflection')),
  text text not null,
  private boolean not null default false
);

create table if not exists life_ideas (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  area text not null default 'business',
  status text not null default 'idea',
  notes text not null default '',
  steps jsonb not null default '[]'::jsonb
);

-- Safe to re-run on a database created from an earlier version of this file.
alter table life_checkins add column if not exists workout boolean not null default false;
alter table life_messages add column if not exists agent text not null default 'chief';
-- Prep tasks for an event (clothes, gift, invitations) point at it.
alter table life_tasks add column if not exists event_id uuid references life_events (id) on delete set null;

create index if not exists life_tasks_open_idx on life_tasks (done, due_date);
create index if not exists life_events_date_idx on life_events (date, start_time);
create index if not exists life_messages_created_idx on life_messages (agent, created_at desc);
create index if not exists life_finance_date_idx on life_finance (date);
create index if not exists life_deals_stage_idx on life_deals (stage, next_date);
create index if not exists life_journal_kind_idx on life_journal (kind, created_at desc);
create index if not exists life_tasks_event_idx on life_tasks (event_id);
create index if not exists life_ideas_status_idx on life_ideas (status, updated_at desc);

alter table life_settings enable row level security;
alter table life_tasks enable row level security;
alter table life_events enable row level security;
alter table life_checkins enable row level security;
alter table life_messages enable row level security;
alter table life_docs enable row level security;
alter table life_shopping enable row level security;
alter table life_finance enable row level security;
alter table life_deals enable row level security;
alter table life_activity enable row level security;
alter table life_journal enable row level security;
alter table life_ideas enable row level security;
