-- La caja buscaba clientes con un SELECT directo sobre beneficiary, y la policy
-- cashiers_can_read_beneficiary dejaba a cualquier cajero leer la tabla entera
-- (DNI, telefono, email) de todos los clubes. Esta RPC devuelve solo lo que la
-- caja muestra, y solo ante una coincidencia exacta:
--   - email (+ id, que es lo que trae el QR del beneficiario)
--   - DNI
--   - id solo, unicamente si ya es socio del club del cajero (fichas que se
--     recargan por id, como la web de caja)
-- Una vez que las apps la usan, la policy se restringe a los socios del club
-- (20261120_cashier_beneficiary_rls_own_org.sql).
create or replace function public.cashier_find_beneficiary(
  p_email text default null,
  p_document_id text default null,
  p_id bigint default null
)
returns table (id bigint, email text, first_name text, last_name text)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_org_id bigint;
begin
  if not (private.is_cashier() or private.has_admin_portal_access()) then
    raise exception 'NOT_STAFF' using errcode = '42501';
  end if;

  select au.organization_id into v_org_id
  from public.app_user au
  where au.auth_user_id = auth.uid()
  limit 1;

  if nullif(trim(p_email), '') is not null then
    return query
      select b.id, b.email, b.first_name, b.last_name
      from public.beneficiary b
      where lower(b.email) = lower(trim(p_email))
        and (p_id is null or b.id = p_id)
      limit 1;
  elsif nullif(trim(p_document_id), '') is not null then
    return query
      select b.id, b.email, b.first_name, b.last_name
      from public.beneficiary b
      where b.document_id = trim(p_document_id)
      limit 1;
  elsif p_id is not null then
    return query
      select b.id, b.email, b.first_name, b.last_name
      from public.beneficiary b
      where b.id = p_id
        and exists (
          select 1 from public.beneficiary_organization bo
          where bo.beneficiary_id = b.id and bo.organization_id = v_org_id
        )
      limit 1;
  end if;
end;
$$;

revoke all on function public.cashier_find_beneficiary(text, text, bigint) from public, anon;
grant execute on function public.cashier_find_beneficiary(text, text, bigint) to authenticated;
