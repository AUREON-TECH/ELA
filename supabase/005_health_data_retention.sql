-- ELA: controles de retenção e exclusão dos dados pessoais
-- Execute somente após 001_private_user_data.sql.
-- Não agenda exclusão automática: oferece uma função explícita para a própria usuária.

create or replace function public.delete_my_ela_data()
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  delete from public.reminder_preferences where user_id = auth.uid();
  delete from public.agenda_events where user_id = auth.uid();
  delete from public.wellbeing_logs where user_id = auth.uid();
  delete from public.checkins where user_id = auth.uid();
  delete from public.cycles where user_id = auth.uid();
  delete from public.profiles where user_id = auth.uid();
end;
$$;

revoke all on function public.delete_my_ela_data() from public;
revoke all on function public.delete_my_ela_data() from anon;
grant execute on function public.delete_my_ela_data() to authenticated;

comment on function public.delete_my_ela_data() is
  'Exclui os dados ELA pertencentes exclusivamente ao usuário autenticado. Não exclui a conta auth.users.';
