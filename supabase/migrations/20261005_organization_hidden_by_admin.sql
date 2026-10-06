-- Ticket "ocultar organización desde superadmin": el superadmin (private.is_platform_admin)
-- puede ocultar una organización (falta de pago, pedido del club) y volver a mostrarla.
-- Es independiente de is_public / show_in_explore, que maneja el owner: oculta gana siempre.
--
-- Se resuelve en RLS para que las 2 apps y las 2 webs lo respeten sin deploy:
--   * el beneficiario no la ve ni en Explorar ni en "mis clubes" (beneficiary_organization);
--   * su staff (cajeros por app_user.organization_id, owners/colaboradores por
--     has_admin_portal_access) la sigue viendo y operando.

alter table public.organization
  add column if not exists hidden_by_admin boolean not null default false;

comment on column public.organization.hidden_by_admin is
  'Oculta la organización a los beneficiarios. Solo la cambia el superadmin (is_platform_admin).';

-- admin_portal_all_organization deja que cualquier owner haga UPDATE de cualquier org:
-- sin este guard un owner podría des-ocultarse solo.
create or replace function private.guard_organization_hidden_by_admin()
returns trigger
language plpgsql
set search_path to 'public', 'pg_temp'
as $$
begin
  if new.hidden_by_admin is distinct from old.hidden_by_admin
     and auth.role() = 'authenticated'
     and not private.is_platform_admin() then
    raise exception 'Only platform admins can change hidden_by_admin'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_organization_hidden_by_admin on public.organization;
create trigger guard_organization_hidden_by_admin
  before update of hidden_by_admin on public.organization
  for each row execute function private.guard_organization_hidden_by_admin();

drop policy if exists mobile_users_can_read_organizations on public.organization;
create policy mobile_users_can_read_organizations
  on public.organization for select to authenticated
  using (
    not hidden_by_admin
    or exists (
      select 1 from public.app_user au
      where au.auth_user_id = auth.uid() and au.organization_id = organization.id
    )
  );

-- El subselect a organization pasa por su RLS: si está oculta, la membresía desaparece.
drop policy if exists mobile_users_can_read_own_organizations on public.beneficiary_organization;
create policy mobile_users_can_read_own_organizations
  on public.beneficiary_organization for select to authenticated
  using (
    exists (
      select 1 from public.beneficiary b
      where b.id = beneficiary_organization.beneficiary_id and b.auth_user_id = auth.uid()
    )
    and exists (select 1 from public.organization o where o.id = beneficiary_organization.organization_id)
  );

drop policy if exists mobile_users_can_join_organizations on public.beneficiary_organization;
create policy mobile_users_can_join_organizations
  on public.beneficiary_organization for insert to authenticated
  with check (
    exists (
      select 1 from public.beneficiary b
      where b.id = beneficiary_organization.beneficiary_id and b.auth_user_id = auth.uid()
    )
    and exists (select 1 from public.organization o where o.id = beneficiary_organization.organization_id)
  );
