-- Las policies admin_portal_all_* eran private.has_admin_portal_access() sin
-- filtro de organizacion: cualquier owner o collaborator (y el onboarding es
-- abierto) leia, editaba y borraba beneficiarios, compras, canjes, staff y
-- direcciones de TODAS las orgs, y podia pasarse a role admin editando su
-- propio app_user. Ademas cualquier app_user (cajeros incluidos) leia y
-- editaba todas las direcciones, y cualquier staff leia/insertaba canjes de
-- cualquier org.
--
-- Regla nueva: el superadmin (role admin) sigue viendo todo; owners y
-- collaborators solo las orgs donde tienen membresia activa en
-- app_user_organization. Lo que no tiene organization_id (beneficiary,
-- address) se resuelve por membresia del beneficiario o por sucursal.

-- ── Helpers ─────────────────────────────────────────────────────────────────
-- Todas security definer: un EXISTS directo en la policy entra en recursion
-- con las policies de beneficiary / beneficiary_organization / branch.

create or replace function private.can_manage_org(p_org bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_platform_admin()
    or (
      p_org is not null
      and private.has_admin_portal_access()
      and exists (
        select 1
        from public.app_user_organization auo
        where auo.app_user_id = private.current_app_user_id()
          and auo.organization_id = p_org
          and auo.is_active
      )
    );
$$;

create or replace function private.staff_can_see_beneficiary(p_beneficiary_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_platform_admin()
    or exists (
      select 1
      from public.beneficiary_organization bo
      where bo.beneficiary_id = p_beneficiary_id
        and private.can_manage_org(bo.organization_id)
    );
$$;

-- p_include_beneficiaries: leer la direccion de un socio si, editarla no.
create or replace function private.staff_can_see_address(p_address_id bigint, p_include_beneficiaries boolean)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_platform_admin()
    or exists (
      select 1 from public.address a
      where a.id = p_address_id and private.can_manage_org(a.organization_id)
    )
    or exists (
      select 1 from public.branch br
      where br.address_id = p_address_id and private.can_manage_org(br.organization_id)
    )
    or (
      p_include_beneficiaries
      and exists (
        select 1 from public.beneficiary b
        where b.address_id = p_address_id and private.staff_can_see_beneficiary(b.id)
      )
    );
$$;

revoke all on function private.can_manage_org(bigint) from public, anon;
revoke all on function private.staff_can_see_beneficiary(bigint) from public, anon;
revoke all on function private.staff_can_see_address(bigint, boolean) from public, anon;
grant execute on function private.can_manage_org(bigint) to authenticated;
grant execute on function private.staff_can_see_beneficiary(bigint) to authenticated;
grant execute on function private.staff_can_see_address(bigint, boolean) to authenticated;

-- ── Tablas con organization_id ──────────────────────────────────────────────

drop policy if exists admin_portal_all_branch on public.branch;
create policy admin_portal_all_branch on public.branch for all to authenticated
  using (private.can_manage_org(organization_id))
  with check (private.can_manage_org(organization_id));

drop policy if exists admin_portal_all_category on public.category;
create policy admin_portal_all_category on public.category for all to authenticated
  using (private.can_manage_org(organization_id))
  with check (private.can_manage_org(organization_id));

drop policy if exists admin_portal_all_points_rule on public.points_rule;
create policy admin_portal_all_points_rule on public.points_rule for all to authenticated
  using (private.can_manage_org(organization_id))
  with check (private.can_manage_org(organization_id));

drop policy if exists admin_portal_all_product on public.product;
create policy admin_portal_all_product on public.product for all to authenticated
  using (private.can_manage_org(organization_id))
  with check (private.can_manage_org(organization_id));

drop policy if exists admin_portal_all_purchase on public.purchase;
create policy admin_portal_all_purchase on public.purchase for all to authenticated
  using (private.can_manage_org(organization_id))
  with check (private.can_manage_org(organization_id));

drop policy if exists admin_portal_all_redemption on public.redemption;
create policy admin_portal_all_redemption on public.redemption for all to authenticated
  using (private.can_manage_org(organization_id))
  with check (private.can_manage_org(organization_id));

drop policy if exists admin_portal_all_beneficiary_organization on public.beneficiary_organization;
create policy admin_portal_all_beneficiary_organization on public.beneficiary_organization for all to authenticated
  using (private.can_manage_org(organization_id))
  with check (private.can_manage_org(organization_id));

-- Los limites del plan los define la plataforma; el owner los lee por
-- app_users_read_own_org_plan_limits y por las RPC de uso.
drop policy if exists admin_portal_all_organization_plan_limits on public.organization_plan_limits;
create policy admin_portal_all_organization_plan_limits on public.organization_plan_limits for all to authenticated
  using (private.is_platform_admin())
  with check (private.is_platform_admin());

-- Crear orgs desde el dashboard es solo del superadmin (el onboarding usa la
-- service role).
drop policy if exists admin_portal_all_organization on public.organization;
create policy admin_portal_all_organization on public.organization for all to authenticated
  using (private.can_manage_org(id))
  with check (private.can_manage_org(id));

-- ── Staff ───────────────────────────────────────────────────────────────────

drop policy if exists admin_portal_all_app_user on public.app_user;
create policy admin_portal_all_app_user on public.app_user for all to authenticated
  using (private.can_manage_org(organization_id))
  with check (private.can_manage_org(organization_id));

-- La fila propia se lee antes de tener membresia (get-current-user, proxy).
create policy app_user_read_own on public.app_user for select to authenticated
  using (auth_user_id = (select auth.uid()));

create policy app_user_update_own on public.app_user for update to authenticated
  using (auth_user_id = (select auth.uid()))
  with check (auth_user_id = (select auth.uid()));

drop policy if exists admin_portal_all_app_user_organization on public.app_user_organization;
create policy admin_portal_all_app_user_organization on public.app_user_organization for all to authenticated
  using (private.can_manage_org(organization_id))
  with check (private.can_manage_org(organization_id));

create policy app_user_organization_read_own on public.app_user_organization for select to authenticated
  using (app_user_id = private.current_app_user_id());

-- El layout del dashboard se autocrea la membresia de su org cuando falta
-- (staff dado de alta sin fila en app_user_organization). Solo la propia y
-- solo la org que ya figura en app_user.organization_id.
create policy app_user_organization_insert_own on public.app_user_organization for insert to authenticated
  with check (
    app_user_id = private.current_app_user_id()
    and private.has_admin_portal_access()
    and organization_id = (
      select au.organization_id from public.app_user au where au.id = private.current_app_user_id()
    )
  );

-- Roles y org del staff: quien no es superadmin no puede dar admin/owner ni
-- mover a alguien (ni a si mismo) a una org que no administra.
create or replace function private.guard_app_user_escalation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
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

drop trigger if exists guard_app_user_escalation on public.app_user;
create trigger guard_app_user_escalation
  before insert or update on public.app_user
  for each row execute function private.guard_app_user_escalation();

-- El plan y la promo los cambian MercadoPago y el superadmin (service role).
create or replace function private.guard_organization_billing()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.role() = 'authenticated'
     and not private.is_platform_admin()
     and (new.plan is distinct from old.plan
          or new.trial_started_at is distinct from old.trial_started_at
          or new.promo_ends_at is distinct from old.promo_ends_at) then
    raise exception 'Only platform admins can change the plan' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_organization_billing on public.organization;
create trigger guard_organization_billing
  before update on public.organization
  for each row execute function private.guard_organization_billing();

-- El catalogo de roles se sigue leyendo por mobile_users_can_read_user_roles.
drop policy if exists admin_portal_all_user_role on public.user_role;
create policy admin_portal_all_user_role on public.user_role for all to authenticated
  using (private.is_platform_admin())
  with check (private.is_platform_admin());

-- ── Beneficiarios ───────────────────────────────────────────────────────────
-- El owner ve a los socios de sus orgs; alta, edicion y baja de beneficiarios
-- son del superadmin (el beneficiario edita lo suyo por sus propias policies).

drop policy if exists admin_portal_all_beneficiary on public.beneficiary;
create policy admin_portal_read_beneficiary on public.beneficiary for select to authenticated
  using (private.staff_can_see_beneficiary(id));
create policy platform_admin_all_beneficiary on public.beneficiary for all to authenticated
  using (private.is_platform_admin())
  with check (private.is_platform_admin());

-- ── Direcciones ─────────────────────────────────────────────────────────────

drop policy if exists "App users can select all addresses" on public.address;
drop policy if exists "App users can insert addresses" on public.address;
drop policy if exists "App users can update all addresses" on public.address;
drop policy if exists "App users can delete all addresses" on public.address;
drop policy if exists "Admin portal can select all addresses" on public.address;
drop policy if exists "Admin portal can insert addresses" on public.address;
drop policy if exists "Admin portal can update all addresses" on public.address;
drop policy if exists "Admin portal can delete all addresses" on public.address;

-- El chequeo por la columna de la propia fila va primero: en el RETURNING de un
-- insert la funcion (que relee address) todavia no ve la fila nueva.
create policy admin_portal_read_address on public.address for select to authenticated
  using (private.can_manage_org(organization_id) or private.staff_can_see_address(id, true));

-- Una direccion nueva de sucursal todavia no esta enlazada: se valida por la
-- org que trae.
create policy admin_portal_insert_address on public.address for insert to authenticated
  with check (private.can_manage_org(organization_id));

create policy admin_portal_update_address on public.address for update to authenticated
  using (private.can_manage_org(organization_id) or private.staff_can_see_address(id, false))
  with check (private.can_manage_org(organization_id) or private.staff_can_see_address(id, false));

create policy admin_portal_delete_address on public.address for delete to authenticated
  using (private.staff_can_see_address(id, false));

-- ── Canjes: el staff de caja solo los de su org ─────────────────────────────

drop policy if exists cashier_select_redemption on public.redemption;
drop policy if exists cashier_insert_redemption on public.redemption;
drop policy if exists "Cashiers can insert redemptions" on public.redemption;

create policy cashier_select_redemption on public.redemption for select to authenticated
  using (
    private.is_cashier()
    and organization_id = (select au.organization_id from public.app_user au where au.auth_user_id = (select auth.uid()))
  );

create policy cashier_insert_redemption on public.redemption for insert to authenticated
  with check (
    private.is_cashier()
    and organization_id = (select au.organization_id from public.app_user au where au.auth_user_id = (select auth.uid()))
  );
