-- Mascara nueva de creacion de campanas (mockup del disenador, 11/09/2026).
-- El mockup pide dos cosas que el modelo no tenia:
--   1. una campana aplica a VARIAS sucursales, no a una sola;
--   2. "Monto fijo de puntos" son puntos planos por venta, no una tasa por peso
--      (fixed_amount ya significaba "puntos por cada $1" y no se puede reusar).

-- 1. Multi-sucursal. NULL = todas, igual que branch_id.
--    branch_id se deja como esta: lo usa la regla madre y las campanas viejas.
alter table public.points_rule add column if not exists branch_ids bigint[];

comment on column public.points_rule.branch_ids is
  'Sucursales donde aplica la campana. NULL = todas. branch_id (una sola) sigue vigente para la regla madre.';

-- 2. Puntos planos por venta.
alter type public.points_rule_type add value if not exists 'fixed_per_sale';

-- points_for_rule compara rule_type como text, asi que no depende del valor
-- nuevo del enum y puede actualizarse en la misma transaccion.
create or replace function public.points_for_rule(p_rule_type text, p_config jsonb, p_amount numeric)
 returns integer
 language plpgsql
 immutable
 set search_path to 'public'
as $function$
declare
  v_tier jsonb;
  v_rate decimal;
begin
  case p_rule_type
    when 'fixed_per_sale' then
      -- Puntos planos: el monto de la venta no interviene en el calculo.
      return coalesce(floor((p_config->>'points_per_sale')::decimal), 0);
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

  return coalesce(floor(p_amount * v_rate), 0);
end;
$function$;

create or replace function public.explain_points_for_amount(p_amount numeric, p_organization_id integer DEFAULT NULL::integer, p_branch_id integer DEFAULT NULL::integer, p_category_id integer DEFAULT NULL::integer, p_purchase_time timestamp with time zone DEFAULT now())
 returns TABLE(rule_id bigint, name text, rule_type text, config jsonb, is_default boolean, points integer)
 language plpgsql
 stable
 set search_path to 'public'
as $function$
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
      -- Una venta siempre ocurre en una sucursal concreta: si la campana esta
      -- acotada y no sabemos donde fue la venta, no aplica.
      and (pr.branch_ids is null or p_branch_id = any(pr.branch_ids))
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
$function$;

create or replace function public.get_active_offers(p_organization_id bigint, p_branch_id bigint, p_check_time timestamp with time zone)
 returns TABLE(id bigint, display_name text, description text, display_icon text, display_color text, rule_type text, config jsonb, time_start time without time zone, time_end time without time zone, days_of_week integer[], valid_until timestamp with time zone)
 language plpgsql
 set search_path to 'public', 'pg_temp'
as $function$
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
    -- Aca p_branch_id null significa "las ofertas del club", no "ninguna
    -- sucursal": es como la llaman la app del beneficiario y el admin. Antes
    -- ese null escondia las campanas acotadas a sucursal; ahora que elegir
    -- sucursales es lo normal, esconderlas dejaria la pantalla vacia.
    and (p_branch_id is null or pr.branch_id is null or pr.branch_id = p_branch_id)
    and (p_branch_id is null or pr.branch_ids is null or p_branch_id = any(pr.branch_ids))
    and (pr.days_of_week is null or v_local_day = any(pr.days_of_week))
    and (
      (pr.time_start is null and pr.time_end is null) or
      (pr.time_start <= pr.time_end and v_local_time >= pr.time_start and v_local_time <= pr.time_end) or
      (pr.time_start > pr.time_end and (v_local_time >= pr.time_start or v_local_time <= pr.time_end))
    )
  order by pr.id desc;
end;
$function$;
