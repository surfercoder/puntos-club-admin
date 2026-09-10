-- El portal admin (role_id = 1) tiene que ver TODAS las entidades. Estas 5 tablas
-- solo tenian policies scopeadas por el organization_id del app_user, y el admin
-- no pertenece a ninguna org -> listados vacios.
-- No se reusa private.has_admin_portal_access() porque incluye owner/collaborator
-- y eso les abriria notificaciones/tokens/suscripciones de otras organizaciones.
create or replace function private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $$
  select exists (
    select 1
    from public.app_user au
    join public.user_role ur on ur.id = au.role_id
    where au.auth_user_id = auth.uid()
      and ur.name::text = 'admin'
      and coalesce(au.active, true) = true
  );
$$;

drop policy if exists platform_admin_all_organization_notification_limits on public.organization_notification_limits;
create policy platform_admin_all_organization_notification_limits
  on public.organization_notification_limits for all
  using (private.is_platform_admin()) with check (private.is_platform_admin());

drop policy if exists platform_admin_all_plan_limits on public.plan_limits;
create policy platform_admin_all_plan_limits
  on public.plan_limits for all
  using (private.is_platform_admin()) with check (private.is_platform_admin());

drop policy if exists platform_admin_all_push_notifications on public.push_notifications;
create policy platform_admin_all_push_notifications
  on public.push_notifications for all
  using (private.is_platform_admin()) with check (private.is_platform_admin());

drop policy if exists platform_admin_all_push_tokens on public.push_tokens;
create policy platform_admin_all_push_tokens
  on public.push_tokens for all
  using (private.is_platform_admin()) with check (private.is_platform_admin());

drop policy if exists platform_admin_all_subscription on public.subscription;
create policy platform_admin_all_subscription
  on public.subscription for all
  using (private.is_platform_admin()) with check (private.is_platform_admin());

-- Aplicado en produccion el 09/09/2026 via SQL directo (mcp execute_sql).
