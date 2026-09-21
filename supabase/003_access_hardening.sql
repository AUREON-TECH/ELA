-- ELA • explicit access hardening
-- Review/apply after 001_private_user_data.sql and 002_data_integrity.sql.
-- This file in GitHub does not mean the production Supabase database was migrated.

-- Sensitive health/wellbeing tables must never be directly accessible to anonymous clients.
revoke all on table public.ela_profiles from anon;
revoke all on table public.ela_cycle_settings from anon;
revoke all on table public.ela_checkins from anon;
revoke all on table public.ela_wellbeing from anon;
revoke all on table public.ela_agenda from anon;

-- Authenticated clients receive only the CRUD privileges the ELA front-end needs.
-- Row Level Security from migration 001 still decides which rows each user may access.
grant select, insert, update, delete on table public.ela_profiles to authenticated;
grant select, insert, update, delete on table public.ela_cycle_settings to authenticated;
grant select, insert, update, delete on table public.ela_checkins to authenticated;
grant select, insert, update, delete on table public.ela_wellbeing to authenticated;
grant select, insert, update, delete on table public.ela_agenda to authenticated;

-- Identity-backed tables use sequences when inserting new rows.
grant usage, select on all sequences in schema public to authenticated;

-- Keep RLS forced for application roles so table privileges cannot bypass user isolation.
alter table public.ela_profiles force row level security;
alter table public.ela_cycle_settings force row level security;
alter table public.ela_checkins force row level security;
alter table public.ela_wellbeing force row level security;
alter table public.ela_agenda force row level security;

comment on table public.ela_profiles is 'ELA private profile. Anonymous access revoked; RLS isolates authenticated users by auth.uid().';
comment on table public.ela_cycle_settings is 'ELA private cycle settings. Anonymous access revoked; RLS isolates authenticated users by auth.uid().';
