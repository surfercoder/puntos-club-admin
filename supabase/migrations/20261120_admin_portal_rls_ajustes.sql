-- Ajustes a 20261120_admin_portal_rls_por_org (review de CodeRabbit):
-- 1. address UPDATE: el WITH CHECK aceptaba staff_can_see_address(id), que
--    mira la fila vieja, asi que un owner podia mover una direccion a otra org.
-- 2. staff_can_see_address daba acceso via branch.address_id sin mirar de que
--    org es la direccion: enlazando una direccion ajena (ej. la de un
--    beneficiario) a una sucursal propia se la podia leer y editar. Todas las
--    direcciones de sucursal tienen organization_id, asi que ese camino sobra.
-- 3. guard_app_user_escalation salia antes de mirar auth_user_id: un owner
--    podia re-enlazar el login de un usuario de su org al suyo.
-- 4. Un owner no tiene que leer ni tocar filas de superadmin aunque tengan su
--    organization_id.

create or replace function private.staff_can_see_address(p_address_id bigint, p_include_beneficiaries boolean)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_platform_admin()
    or exists (select 1 from public.address a where a.id = p_address_id and private.can_manage_org(a.organization_id))
    or (
      p_include_beneficiaries
      and exists (select 1 from public.beneficiary b where b.address_id = p_address_id and private.staff_can_see_beneficiary(b.id))
    );
$$;

drop policy if exists admin_portal_update_address on public.address;
create policy admin_portal_update_address on public.address for update to authenticated
  using (private.can_manage_org(organization_id) or private.staff_can_see_address(id, false))
  with check (private.can_manage_org(organization_id));

drop policy if exists admin_portal_all_app_user on public.app_user;
create policy admin_portal_all_app_user on public.app_user for all to authenticated
  using (
    private.can_manage_org(organization_id)
    and (private.is_platform_admin() or role_id is distinct from (select ur.id from public.user_role ur where ur.name = 'admin'))
  )
  with check (private.can_manage_org(organization_id));

create or replace function private.guard_app_user_escalation()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_role text;
  v_role_changed boolean := tg_op = 'INSERT';
begin
  -- Sin JWT (service role, triggers de Supabase Auth como el que sincroniza el
  -- email) auth.role() es null: no es un usuario del admin.
  if coalesce(auth.role(), '') <> 'authenticated' or private.is_platform_admin() then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    -- Por app_user_update_own (el cajero editando su nombre desde Caja) solo
    -- entran datos personales: nada que de acceso.
    if not private.can_manage_org(old.organization_id)
       and (new.role_id is distinct from old.role_id
            or new.organization_id is distinct from old.organization_id
            or new.active is distinct from old.active
            or new.branch_id is distinct from old.branch_id
            or new.auth_user_id is distinct from old.auth_user_id
            or new.email is distinct from old.email) then
      raise exception 'Only your organization admins can change this' using errcode = '42501';
    end if;
    -- Enlazar un login a quien no tenia (updateAppUser al crearle el usuario de
    -- Auth) si; cambiar el login de alguien, no.
    if old.auth_user_id is not null and new.auth_user_id is distinct from old.auth_user_id then
      raise exception 'Cannot change the login of an existing user' using errcode = '42501';
    end if;
    if new.role_id is not distinct from old.role_id
       and new.organization_id is not distinct from old.organization_id then
      return new;
    end if;
    v_role_changed := new.role_id is distinct from old.role_id;
  end if;

  select ur.name::text into v_role from public.user_role ur where ur.id = new.role_id;
  if v_role_changed and v_role in ('admin', 'owner') then
    raise exception 'Only platform admins can assign the % role', v_role using errcode = '42501';
  end if;

  if new.organization_id is not null and not private.can_manage_org(new.organization_id) then
    raise exception 'Cannot move a user to an organization you do not manage' using errcode = '42501';
  end if;

  return new;
end;
$$;
