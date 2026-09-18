-- ELA | estrutura inicial segura para Supabase
-- Execute no SQL Editor do projeto Supabase antes de conectar o frontend.
-- Este arquivo prepara o banco; sozinho não ativa login nem sincronização.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  birth_date date,
  zodiac_sign text,
  cycle_length smallint default 28 check (cycle_length between 20 and 45),
  period_length smallint default 5 check (period_length between 2 and 10),
  last_period date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  checkin_date date not null default current_date,
  mood text,
  energy smallint check (energy between 1 and 10),
  symptoms text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, checkin_date)
);

create table if not exists public.wellbeing_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null default current_date,
  cramps smallint check (cramps between 0 and 4),
  pms smallint check (pms between 0 and 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

create table if not exists public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null default current_date,
  body text not null check (char_length(body) <= 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agenda_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_date date not null,
  event_time time,
  title text not null check (char_length(title) <= 500),
  reminder_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Compatibilidade caso agenda_events já tenha sido criada pela versão anterior.
alter table public.agenda_events add column if not exists event_time time;
alter table public.agenda_events add column if not exists updated_at timestamptz not null default now();

alter table public.profiles enable row level security;
alter table public.checkins enable row level security;
alter table public.wellbeing_entries enable row level security;
alter table public.diary_entries enable row level security;
alter table public.agenda_events enable row level security;

-- RLS explícita: cada conta autenticada só pode acessar os próprios dados.
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_delete_own" on public.profiles for delete using (auth.uid() = id);

drop policy if exists "checkins_select_own" on public.checkins;
drop policy if exists "checkins_insert_own" on public.checkins;
drop policy if exists "checkins_update_own" on public.checkins;
drop policy if exists "checkins_delete_own" on public.checkins;
create policy "checkins_select_own" on public.checkins for select using (auth.uid() = user_id);
create policy "checkins_insert_own" on public.checkins for insert with check (auth.uid() = user_id);
create policy "checkins_update_own" on public.checkins for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "checkins_delete_own" on public.checkins for delete using (auth.uid() = user_id);

drop policy if exists "wellbeing_select_own" on public.wellbeing_entries;
drop policy if exists "wellbeing_insert_own" on public.wellbeing_entries;
drop policy if exists "wellbeing_update_own" on public.wellbeing_entries;
drop policy if exists "wellbeing_delete_own" on public.wellbeing_entries;
create policy "wellbeing_select_own" on public.wellbeing_entries for select using (auth.uid() = user_id);
create policy "wellbeing_insert_own" on public.wellbeing_entries for insert with check (auth.uid() = user_id);
create policy "wellbeing_update_own" on public.wellbeing_entries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "wellbeing_delete_own" on public.wellbeing_entries for delete using (auth.uid() = user_id);

drop policy if exists "diary_select_own" on public.diary_entries;
drop policy if exists "diary_insert_own" on public.diary_entries;
drop policy if exists "diary_update_own" on public.diary_entries;
drop policy if exists "diary_delete_own" on public.diary_entries;
create policy "diary_select_own" on public.diary_entries for select using (auth.uid() = user_id);
create policy "diary_insert_own" on public.diary_entries for insert with check (auth.uid() = user_id);
create policy "diary_update_own" on public.diary_entries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "diary_delete_own" on public.diary_entries for delete using (auth.uid() = user_id);

drop policy if exists "agenda_select_own" on public.agenda_events;
drop policy if exists "agenda_insert_own" on public.agenda_events;
drop policy if exists "agenda_update_own" on public.agenda_events;
drop policy if exists "agenda_delete_own" on public.agenda_events;
create policy "agenda_select_own" on public.agenda_events for select using (auth.uid() = user_id);
create policy "agenda_insert_own" on public.agenda_events for insert with check (auth.uid() = user_id);
create policy "agenda_update_own" on public.agenda_events for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "agenda_delete_own" on public.agenda_events for delete using (auth.uid() = user_id);

create index if not exists checkins_user_date_idx on public.checkins(user_id, checkin_date desc);
create index if not exists wellbeing_user_date_idx on public.wellbeing_entries(user_id, entry_date desc);
create index if not exists diary_user_date_idx on public.diary_entries(user_id, entry_date desc);
create index if not exists agenda_user_date_idx on public.agenda_events(user_id, event_date, event_time);

-- Antes de conectar o frontend:
-- 1) habilitar Google em Authentication > Providers no projeto Supabase;
-- 2) cadastrar as URLs de redirect autorizadas (produção e desenvolvimento);
-- 3) usar somente URL do projeto + chave anon/publishable no navegador; nunca service_role;
-- 4) executar/testar este SQL no projeto correto e validar RLS com duas contas distintas;
-- 5) migrar localStorage somente após login explícito e confirmação da usuária.
