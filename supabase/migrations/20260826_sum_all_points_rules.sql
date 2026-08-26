-- Los socios decidieron (26/08/2026) que las reglas SUMAN: una venta de $1000 con
-- la regla madre (1 pt por $1) y una campana de invierno (10%) da 1100 puntos, no
-- 1000. Antes calculate_points_for_amount elegia una sola regla y la madre era
-- solo el fallback.
--
-- explain_points_for_amount es la fuente de verdad: devuelve el aporte de cada
-- regla y calculate_points_for_amount pasa a ser la suma, asi el desglose que ve
-- el cajero no puede desviarse del total que se guarda.

create or replace function public.points_for_rule(
  p_rule_type text,
  p_config jsonb,
  p_amount numeric
) returns integer
language plpgsql
immutable
set search_path to 'public'
as $$
declare
  v_tier jsonb;
  v_rate decimal;
begin
  case p_rule_type
    when 'fixed_amount' then
      v_rate := (p_config->>'points_per_dollar')::decimal;
    when 'percentage' then
      v_rate := (p_config->>'percentage')::decimal / 100;
    when 'fixed_per_item' then
      v_rate := (p_config->>'points_per_item')::decimal;
    when 'tiered' then
      for v_tier in select * from jsonb_array_elements(p_config->'tiers') loop
        if (v_tier->>'min')::decimal <= p_amount and
           ((v_tier->>'max') is null or (v_tier->>'max')::decimal >= p_amount) then
          v_rate := (v_tier->>'points_per_dollar')::decimal;
          exit;
        end if;
      end loop;
    else
      return 0;
  end case;

  -- config es jsonb cargado a mano desde el admin: una regla sin el numero daria
  -- null y arrastraria todo el total a null.
  return coalesce(floor(p_amount * v_rate), 0);
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
    -- Todas las campanas/reglas puntuales vigentes ahora: antes ganaba una sola.
    select pr.id, pr.name, pr.display_name, pr.rule_type, pr.config, pr.is_default, pr.priority
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
    select d.id, d.name, d.display_name, d.rule_type, d.config, d.is_default, d.priority
    from (
      select pr.*
      from points_rule pr
      where pr.is_active = true
        and pr.is_default = true
        and (pr.organization_id = p_organization_id or pr.organization_id is null)
      order by pr.priority desc, (pr.organization_id is null) asc, pr.id desc
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
  order by m.is_default desc, m.priority desc, m.id desc;
end;
$$;

create or replace function public.calculate_points_for_amount(
  p_amount numeric,
  p_organization_id integer default null,
  p_branch_id integer default null,
  p_category_id integer default null,
  p_purchase_time timestamp with time zone default now()
) returns integer
language sql
stable
set search_path to 'public'
as $$
  select coalesce(sum(e.points), 0)::integer
  from public.explain_points_for_amount(
    p_amount, p_organization_id, p_branch_id, p_category_id, p_purchase_time
  ) e;
$$;

grant execute on function public.points_for_rule(text, jsonb, numeric) to anon, authenticated, service_role;
grant execute on function public.explain_points_for_amount(numeric, integer, integer, integer, timestamp with time zone) to anon, authenticated, service_role;
