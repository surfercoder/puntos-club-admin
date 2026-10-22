-- Ticket "filtro de clubes por departamento, provincia, país o cerca de mí".
-- Explorar lista orgs donde el beneficiario todavía no es miembro, y
-- beneficiary_read_branch_addresses solo le deja leer direcciones de sus clubes.
-- Esta función expone lo justo para filtrar: país, provincia (state), departamento
-- (city) y coordenadas de las sucursales activas. Nunca calle ni número.
create or replace function public.explore_org_locations()
returns table (
  organization_id bigint,
  country text,
  state text,
  city text,
  latitude double precision,
  longitude double precision
)
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $$
  select br.organization_id, a.country, a.state, a.city, a.latitude, a.longitude
  from branch br
  join address a on a.id = br.address_id
  join organization o on o.id = br.organization_id
  where br.active and o.is_public and not o.hidden_by_admin;
$$;

revoke all on function public.explore_org_locations() from public, anon;
grant execute on function public.explore_org_locations() to authenticated;
