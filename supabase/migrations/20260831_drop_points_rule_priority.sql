-- Desde que todas las reglas activas suman (20260826_sum_all_points_rules), la
-- prioridad no decide nada: no hay una regla "que gana". Se va de la tabla, del
-- trigger que la forzaba a 0 en la regla madre y del orden de las dos funciones
-- que la miraban.

drop trigger if exists trg_points_rule_enforce_default_priority on public.points_rule;
drop function if exists public.points_rule_enforce_default_priority();

create or replace function public.get_active_offers(
  p_organization_id bigint,
  p_branch_id bigint,
  p_check_time timestamp with time zone
) returns table(
  id bigint,
  display_name text,
  description text,
  display_icon text,
  display_color text,
  rule_type text,
  config jsonb,
  time_start time without time zone,
  time_end time without time zone,
  days_of_week integer[],
  valid_until timestamp with time zone
)
language plpgsql
set search_path to 'public', 'pg_temp'
as $$
declare
  v_local_time time;
  v_local_day integer;
  v_org_timezone text;
  v_local_timestamp timestamp;
  v_local_date date;
begin
  select timezone into v_org_timezone from organization where organization.id = p_organization_id;
  if v_org_timezone is null then
    v_org_timezone := 'America/Argentina/Buenos_Aires';
  end if;
  v_local_timestamp := p_check_time at time zone v_org_timezone;
  v_local_time := v_local_timestamp::time;
  v_local_day := extract(dow from v_local_timestamp)::integer;
  v_local_date := v_local_timestamp::date;

  return query
  select pr.id, pr.display_name::text, pr.description::text, pr.display_icon::text,
         pr.display_color::text, pr.rule_type::text, pr.config,
         pr.time_start, pr.time_end, pr.days_of_week, pr.valid_until
  from points_rule pr
  where pr.is_active = true
    and pr.is_default = false
    and pr.show_in_app = true
    and (pr.start_date is null or pr.start_date <= v_local_date)
    and (pr.end_date is null or pr.end_date >= v_local_date)
    and (pr.valid_from is null or pr.valid_from <= p_check_time)
    and (pr.valid_until is null or pr.valid_until >= p_check_time)
    and (pr.organization_id is null or pr.organization_id = p_organization_id)
    and (pr.branch_id is null or pr.branch_id = p_branch_id)
    and (pr.days_of_week is null or v_local_day = any(pr.days_of_week))
    and (
      (pr.time_start is null and pr.time_end is null) or
      (pr.time_start <= pr.time_end and v_local_time >= pr.time_start and v_local_time <= pr.time_end) or
      (pr.time_start > pr.time_end and (v_local_time >= pr.time_start or v_local_time <= pr.time_end))
    )
  order by pr.id desc;
end;
$$;

create or replace function public.explain_points_for_amount(
  p_amount numeric,
  p_organization_id integer default null,
  p_branch_id integer default null,
  p_category_id integer default null,
  p_purchase_time timestamp with time zone default now()
) returns table(
  rule_id bigint,
  name text,
  rule_type text,
  config jsonb,
  is_default boolean,
  points integer
)
language plpgsql
stable
set search_path to 'public'
as $$
declare
  v_org_timezone text;
  v_local_timestamp timestamp;
  v_local_time time;
  v_local_day integer;
  v_local_date date;
begin
  select organization.timezone into v_org_timezone
  from organization where organization.id = p_organization_id;
  if v_org_timezone is null then
    v_org_timezone := 'America/Argentina/Buenos_Aires';
  end if;

  v_local_timestamp := p_purchase_time at time zone v_org_timezone;
  v_local_time := v_local_timestamp::time;
  v_local_day := extract(dow from v_local_timestamp)::integer;
  v_local_date := v_local_timestamp::date;

  return query
  with matched as (
    -- Todas las campanas/reglas puntuales vigentes ahora: suman todas.
    select pr.id, pr.name, pr.display_name, pr.rule_type, pr.config, pr.is_default
    from points_rule pr
    where pr.is_active = true
      and pr.is_default = false
      and (pr.start_date is null or pr.start_date <= v_local_date)
      and (pr.end_date is null or pr.end_date >= v_local_date)
      and (pr.valid_from is null or pr.valid_from <= p_purchase_time)
      and (pr.valid_until is null or pr.valid_until >= p_purchase_time)
      and (pr.organization_id is null or pr.organization_id = p_organization_id)
      and (pr.branch_id is null or pr.branch_id = p_branch_id)
      and (pr.category_id is null or pr.category_id = p_category_id)
      and (pr.days_of_week is null or v_local_day = any(pr.days_of_week))
      and (
        (pr.time_start is null and pr.time_end is null) or
        (pr.time_start <= pr.time_end and v_local_time >= pr.time_start and v_local_time <= pr.time_end) or
        (pr.time_start > pr.time_end and (v_local_time >= pr.time_start or v_local_time <= pr.time_end))
      )
    union all
    -- La regla madre suma siempre; sigue siendo una sola (la de la organizacion
    -- antes que la global) para no duplicar la base.
    select d.id, d.name, d.display_name, d.rule_type, d.config, d.is_default
    from (
      select pr.*
      from points_rule pr
      where pr.is_active = true
        and pr.is_default = true
        and (pr.organization_id = p_organization_id or pr.organization_id is null)
      order by (pr.organization_id is null) asc, pr.id desc
      limit 1
    ) d
  )
  select m.id,
         coalesce(nullif(m.display_name, ''), m.name)::text,
         m.rule_type::text,
         m.config,
         m.is_default,
         public.points_for_rule(m.rule_type::text, m.config, p_amount)
  from matched m
  order by m.is_default desc, m.id desc;
end;
$$;

-- El indice unico (organization_id, priority) se va con la columna.
alter table public.points_rule drop column if exists priority;
