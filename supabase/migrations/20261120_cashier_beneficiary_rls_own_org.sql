-- Aplicar DESPUES de que Caja (app y web) busque clientes con
-- cashier_find_beneficiary: las versiones viejas de la app leen beneficiary
-- directo y dejarian de encontrar a quien todavia no es socio del club.
-- El cajero sigue viendo a los socios de su club (con o sin membresia activa),
-- que es lo que necesitan los joins de ventas, canjes y entregas.
-- Va por funcion security definer: un EXISTS sobre beneficiary_organization en
-- la policy entra en recursion con mobile_users_can_read_own_organizations,
-- que a su vez lee beneficiary.
create or replace function private.cashier_can_see_beneficiary(p_beneficiary_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.beneficiary_organization bo
    join public.app_user au on au.organization_id = bo.organization_id
    join public.user_role ur on ur.id = au.role_id
    where bo.beneficiary_id = p_beneficiary_id
      and au.auth_user_id = auth.uid()
      and ur.name = 'cashier'
      and coalesce(au.active, true)
  );
$$;

revoke all on function private.cashier_can_see_beneficiary(bigint) from public, anon;
grant execute on function private.cashier_can_see_beneficiary(bigint) to authenticated;

drop policy if exists cashiers_can_read_beneficiary on public.beneficiary;

create policy cashiers_can_read_beneficiary on public.beneficiary
  for select to authenticated
  using (private.cashier_can_see_beneficiary(id));
