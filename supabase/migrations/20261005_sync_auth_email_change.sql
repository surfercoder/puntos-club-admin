-- Cuando GoTrue termina un cambio de email (las dos casillas confirmadas con
-- double_confirm_changes), auth.users.email cambia pero app_user/beneficiary
-- seguian con el viejo: el perfil mostraba el mail anterior y los lookups por
-- email (find-user, beneficiary/verify, purchase) dejaban de encontrarlo.

create or replace function public.sync_auth_email_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.app_user set email = new.email where auth_user_id = new.id;
  update public.beneficiary set email = new.email where auth_user_id = new.id;
  return new;
end;
$$;

revoke execute on function public.sync_auth_email_change() from public, anon, authenticated;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.sync_auth_email_change();
