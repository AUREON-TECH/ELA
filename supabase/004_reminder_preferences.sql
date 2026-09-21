-- ELA • private reminder preferences
-- This migration prepares per-user reminder settings for cycle, check-in and agenda.
-- It does not schedule browser/push notifications by itself.

create table if not exists public.ela_reminder_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  daily_checkin_enabled boolean not null default true,
  daily_checkin_time time not null default '20:00',
  period_reminder_enabled boolean not null default true,
  period_reminder_days_before smallint not null default 2
    check (period_reminder_days_before between 0 and 14),
  fertile_window_enabled boolean not null default false,
  pms_reminder_enabled boolean not null default true,
  agenda_reminders_enabled boolean not null default true,
  timezone text not null default 'America/Sao_Paulo'
    check (char_length(timezone) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ela_reminder_preferences enable row level security;
alter table public.ela_reminder_preferences force row level security;

drop policy if exists ela_reminder_preferences_own_rows on public.ela_reminder_preferences;
create policy ela_reminder_preferences_own_rows
  on public.ela_reminder_preferences
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke all on table public.ela_reminder_preferences from anon;
grant select, insert, update, delete on table public.ela_reminder_preferences to authenticated;

-- Reuse the updated_at trigger function created by 002_data_integrity.sql when available.
do $$
begin
  if to_regprocedure('public.ela_set_updated_at()') is not null then
    execute 'drop trigger if exists ela_reminder_preferences_set_updated_at on public.ela_reminder_preferences';
    execute 'create trigger ela_reminder_preferences_set_updated_at before update on public.ela_reminder_preferences for each row execute function public.ela_set_updated_at()';
  end if;
end $$;

comment on table public.ela_reminder_preferences is
  'ELA private reminder preferences. RLS isolates settings by auth.uid().';
