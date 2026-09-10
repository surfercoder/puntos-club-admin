-- "Necesito ayuda" en la app de caja abre el mail al responsable de la organizacion.
-- Ahora prioriza el mail de contacto que el owner cargo en el perfil de la organizacion
-- y recien si esta vacio o ausente cae al mail con el que el owner se loguea.
-- El nombre de la funcion no cambia para no tocar la app ya publicada.
create or replace function public.get_my_owner_email()
returns text
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $function$
  select coalesce(
    nullif(btrim(org.contact_email), ''),
    (
      select owner.email
      from app_user owner
      join user_role owner_role on owner_role.id = owner.role_id and owner_role.name = 'owner'
      where owner.organization_id = me.organization_id
        and owner.active
      order by owner.id
      limit 1
    )
  )
  from app_user me
  join user_role me_role on me_role.id = me.role_id
  join organization org on org.id = me.organization_id
  where me.auth_user_id = auth.uid()
    and me.active
    and me_role.name in ('cashier', 'owner')
  limit 1;
$function$;

-- Aplicado en produccion el 10/09/2026 via SQL directo (mcp execute_sql).
