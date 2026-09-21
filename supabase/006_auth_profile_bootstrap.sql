-- ELA • bootstrap de perfil após autenticação
-- Prepara o fluxo de Login Google/Supabase sem expor dados entre usuárias.
-- Este arquivo precisa ser aplicado no projeto Supabase para produzir efeito no banco.

create or replace function public.handle_new_ela_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  inferred_name text;
begin
  inferred_name := nullif(trim(coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    ''
  )), '');

  insert into public.ela_profiles (user_id, display_name)
  values (new.id, inferred_name)
  on conflict (user_id) do update
    set display_name = coalesce(public.ela_profiles.display_name, excluded.display_name),
        updated_at = now();

  insert into public.ela_cycle_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_ela_user() from public;
revoke all on function public.handle_new_ela_user() from anon;
revoke all on function public.handle_new_ela_user() from authenticated;

drop trigger if exists on_auth_user_created_ela on auth.users;
create trigger on_auth_user_created_ela
  after insert on auth.users
  for each row execute function public.handle_new_ela_user();

comment on function public.handle_new_ela_user() is
  'Creates the private ELA profile and default cycle settings when a Supabase Auth user is created.';
