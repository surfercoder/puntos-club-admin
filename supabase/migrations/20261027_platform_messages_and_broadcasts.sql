-- Ticket "Desde superadmin mandar notificaciones a beneficiarios y owners" (27/10/2026).
--
-- 1) platform_message: mensajeria superadmin <-> organizacion. Un hilo por
--    organizacion (no por usuario): todos los owners/collaborators activos de la
--    org lo ven en la campanita y cualquiera puede responder.
-- 2) platform_broadcast: historial de los push que el superadmin manda a TODOS
--    los beneficiarios. No va en push_notifications porque ahi organization_id
--    es NOT NULL y esa tabla descuenta del saldo de la org.

create table if not exists public.platform_message (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organization(id) on delete cascade,
  sender_id bigint not null references public.app_user(id),
  -- true = lo escribio el superadmin; false = respuesta de la organizacion.
  from_platform boolean not null,
  body text not null check (length(btrim(body)) between 1 and 2000),
  -- ponytail: leido por organizacion, no por usuario; si dos owners leen el
  -- mismo hilo basta con que uno lo abra. Tabla de lecturas si hace falta.
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists platform_message_org_created_idx
  on public.platform_message (organization_id, created_at desc);
create index if not exists platform_message_unread_idx
  on public.platform_message (from_platform, organization_id)
  where read_at is null;

alter table public.platform_message enable row level security;

-- Owner/collaborator con membresia activa en la org. Cajeros y beneficiarios no
-- entran: has_admin_portal_access() solo deja admin/owner/collaborator.
create or replace function private.is_org_staff(p_org bigint)
returns boolean
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $$
  select private.has_admin_portal_access()
    and exists (
      select 1
      from public.app_user_organization auo
      where auo.app_user_id = private.current_app_user_id()
        and auo.organization_id = p_org
        and auo.is_active = true
    );
$$;

drop policy if exists platform_admin_all_platform_message on public.platform_message;
create policy platform_admin_all_platform_message
  on public.platform_message for all
  using (private.is_platform_admin()) with check (private.is_platform_admin());

drop policy if exists org_staff_read_platform_message on public.platform_message;
create policy org_staff_read_platform_message
  on public.platform_message for select
  using (private.is_org_staff(organization_id));

-- La org solo responde en su hilo, a su nombre y nunca como plataforma.
drop policy if exists org_staff_reply_platform_message on public.platform_message;
create policy org_staff_reply_platform_message
  on public.platform_message for insert
  with check (
    private.is_org_staff(organization_id)
    and from_platform = false
    and sender_id = private.current_app_user_id()
    and read_at is null
  );

-- Sin policy de UPDATE para la org: marcar leido pasa por esta funcion, asi
-- nadie puede editar el texto de un mensaje ya mandado.
create or replace function public.mark_platform_messages_read(p_org bigint)
returns void
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
begin
  if private.is_platform_admin() then
    update public.platform_message
       set read_at = now()
     where organization_id = p_org and from_platform = false and read_at is null;
  elsif private.is_org_staff(p_org) then
    update public.platform_message
       set read_at = now()
     where organization_id = p_org and from_platform = true and read_at is null;
  else
    raise exception 'forbidden' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.mark_platform_messages_read(bigint) from public, anon;
grant execute on function public.mark_platform_messages_read(bigint) to authenticated;
grant execute on function private.is_org_staff(bigint) to authenticated;

create table if not exists public.platform_broadcast (
  id bigint generated always as identity primary key,
  created_by bigint not null references public.app_user(id),
  title text not null check (length(btrim(title)) between 1 and 65),
  body text not null check (length(btrim(body)) between 1 and 240),
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.platform_broadcast enable row level security;

drop policy if exists platform_admin_all_platform_broadcast on public.platform_broadcast;
create policy platform_admin_all_platform_broadcast
  on public.platform_broadcast for all
  using (private.is_platform_admin()) with check (private.is_platform_admin());
