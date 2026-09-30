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
  day_rating int,
  note text,
  updated_at timestamptz not null default now()
);

create table if not exists life_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  role text not null check (role in ('user', 'assistant')),
  content text not null
);

create index if not exists life_tasks_open_idx on life_tasks (done, due_date);
create index if not exists life_events_date_idx on life_events (date, start_time);
create index if not exists life_messages_created_idx on life_messages (created_at desc);

alter table life_settings enable row level security;
alter table life_tasks enable row level security;
alter table life_events enable row level security;
alter table life_checkins enable row level security;
alter table life_messages enable row level security;
