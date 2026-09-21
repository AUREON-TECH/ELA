-- ELA • private data integrity hardening
-- Review/apply after 001_private_user_data.sql.
-- This repository change alone does not alter a Supabase project.

-- Keep updated_at trustworthy without relying on every client to set it.
create or replace function public.ela_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array['ela_profiles','ela_cycle_settings','ela_checkins','ela_wellbeing','ela_agenda']
  loop
    execute format('drop trigger if exists %I on public.%I', 'set_updated_at', t);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.ela_set_updated_at()',
      'set_updated_at', t
    );
  end loop;
end $$;

-- Check-in symptoms are expected to be a JSON array (e.g. ["cólica","dor de cabeça"]).
alter table public.ela_checkins
  drop constraint if exists ela_checkins_symptoms_array_check;
alter table public.ela_checkins
  add constraint ela_checkins_symptoms_array_check
  check (jsonb_typeof(symptoms) = 'array');

-- Basic limits reduce accidental/unbounded payloads while preserving normal notes and emojis.
alter table public.ela_checkins
  drop constraint if exists ela_checkins_mood_length_check;
alter table public.ela_checkins
  add constraint ela_checkins_mood_length_check
  check (mood is null or char_length(mood) <= 80);

alter table public.ela_checkins
  drop constraint if exists ela_checkins_notes_length_check;
alter table public.ela_checkins
  add constraint ela_checkins_notes_length_check
  check (notes is null or char_length(notes) <= 4000);

alter table public.ela_wellbeing
  drop constraint if exists ela_wellbeing_notes_length_check;
alter table public.ela_wellbeing
  add constraint ela_wellbeing_notes_length_check
  check (notes is null or char_length(notes) <= 4000);

alter table public.ela_agenda
  drop constraint if exists ela_agenda_title_length_check;
alter table public.ela_agenda
  add constraint ela_agenda_title_length_check
  check (char_length(title) between 1 and 200);

alter table public.ela_agenda
  drop constraint if exists ela_agenda_notes_length_check;
alter table public.ela_agenda
  add constraint ela_agenda_notes_length_check
  check (notes is null or char_length(notes) <= 4000);

comment on function public.ela_set_updated_at() is 'Maintains updated_at for ELA private tables.';
