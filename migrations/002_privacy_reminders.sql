-- ELA | privacidade e lembretes
-- Aplicar depois de supabase-schema.sql.

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  notifications_enabled boolean not null default false,
  cycle_reminders boolean not null default true,
  checkin_reminders boolean not null default true,
  agenda_reminders boolean not null default true,
  reminder_time time not null default '20:00',
  privacy_lock_enabled boolean not null default false,
  analytics_opt_in boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('cycle','checkin','agenda','self_care','custom')),
  title text not null,
  remind_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;
alter table public.reminders enable row level security;

create policy "preferences_select_own" on public.user_preferences for select using (auth.uid() = user_id);
create policy "preferences_insert_own" on public.user_preferences for insert with check (auth.uid() = user_id);
create policy "preferences_update_own" on public.user_preferences for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "preferences_delete_own" on public.user_preferences for delete using (auth.uid() = user_id);

create policy "reminders_select_own" on public.reminders for select using (auth.uid() = user_id);
create policy "reminders_insert_own" on public.reminders for insert with check (auth.uid() = user_id);
create policy "reminders_update_own" on public.reminders for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "reminders_delete_own" on public.reminders for delete using (auth.uid() = user_id);

create index if not exists reminders_user_time_idx on public.reminders(user_id, remind_at);

-- Segurança: não armazenar PIN em texto puro. Se o bloqueio local for implementado,
-- usar WebAuthn/biometria do dispositivo quando disponível ou derivação de chave adequada.
-- Notificações push exigirão service worker + permissão explícita da usuária.
