-- ELA | Controles de privacidade e portabilidade
-- Aplicar somente depois de supabase-schema.sql e 002_privacy_reminders.sql.
-- Mantém cada operação limitada ao usuário autenticado.

-- Exportação estruturada dos dados pessoais da própria usuária.
create or replace function public.export_my_ela_data()
returns jsonb
language sql
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'exported_at', now(),
    'profile', (select to_jsonb(p) from public.profiles p where p.id = auth.uid()),
    'checkins', coalesce((select jsonb_agg(to_jsonb(c) order by c.checkin_date desc) from public.checkins c where c.user_id = auth.uid()), '[]'::jsonb),
    'diary_entries', coalesce((select jsonb_agg(to_jsonb(d) order by d.entry_date desc) from public.diary_entries d where d.user_id = auth.uid()), '[]'::jsonb),
    'agenda_events', coalesce((select jsonb_agg(to_jsonb(a) order by a.event_date) from public.agenda_events a where a.user_id = auth.uid()), '[]'::jsonb),
    'preferences', (select to_jsonb(up) from public.user_preferences up where up.user_id = auth.uid()),
    'reminders', coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at desc) from public.reminders r where r.user_id = auth.uid()), '[]'::jsonb)
  );
$$;

revoke all on function public.export_my_ela_data() from public;
grant execute on function public.export_my_ela_data() to authenticated;

-- Apaga dados do ELA, mas não remove a conta auth.users.
-- A exclusão da conta de autenticação deve ocorrer por backend/Edge Function segura,
-- usando credencial de servidor e confirmação explícita da usuária.
create or replace function public.delete_my_ela_data()
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  delete from public.reminders where user_id = auth.uid();
  delete from public.agenda_events where user_id = auth.uid();
  delete from public.diary_entries where user_id = auth.uid();
  delete from public.checkins where user_id = auth.uid();
  delete from public.user_preferences where user_id = auth.uid();
  delete from public.profiles where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_ela_data() from public;
grant execute on function public.delete_my_ela_data() to authenticated;

comment on function public.export_my_ela_data() is 'Exporta em JSON somente os dados ELA da usuária autenticada.';
comment on function public.delete_my_ela_data() is 'Apaga somente os dados ELA da usuária autenticada; não exclui auth.users.';
