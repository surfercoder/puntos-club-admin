-- ============================================================
-- Planes v2 — cuarto plan (enterprise) y matriz completa de features
--
-- Cambios:
--   1. 'enterprise' pasa a ser un plan válido.
--   2. plan_limits / organization_plan_limits pasan de 6 a 22 features:
--      las 6 cuotas numéricas de siempre + 16 flags de "incluido / no incluido".
--      Los flags se guardan en la misma columna: 1 = incluido, 0 = no incluido,
--      así check_plan_limit() los responde sin lógica nueva.
--   3. limit_value = -1 significa "sin límite" (antes no existía la noción).
--   4. Se borra todo y se re-siembra: los 4 planes quedan con los mismos 22
--      registros y los valores del excel de planes.
-- ============================================================

-- 1. 'enterprise' como plan válido -----------------------------------------
ALTER TABLE public.organization
  DROP CONSTRAINT IF EXISTS organization_plan_check,
  ADD  CONSTRAINT organization_plan_check
       CHECK (plan IN ('trial', 'advance', 'pro', 'enterprise'));

-- subscription queda en ('advance','pro') a propósito: enterprise se vende
-- por contacto comercial, no tiene checkout de Mercado Pago.

-- 2. Nueva lista de features y -1 = sin límite ------------------------------
ALTER TABLE public.plan_limits
  DROP CONSTRAINT IF EXISTS plan_limits_plan_check,
  DROP CONSTRAINT IF EXISTS plan_limits_feature_check,
  DROP CONSTRAINT IF EXISTS plan_limits_limit_value_check,
  ADD  CONSTRAINT plan_limits_plan_check
       CHECK (plan IN ('trial', 'advance', 'pro', 'enterprise')),
  ADD  CONSTRAINT plan_limits_feature_check
       CHECK (feature IN (
         'beneficiaries', 'redeemable_products', 'push_notifications_monthly',
         'cashiers', 'branches', 'collaborators',
         'beneficiary_map', 'exports', 'private_club', 'virtual_cashier',
         'campaigns', 'api', 'webhooks', 'sso', 'white_label',
         'advanced_roles', 'audit', 'erp_integration', 'sla',
         'priority_support', 'trained_ai', 'account_manager'
       )),
  ADD  CONSTRAINT plan_limits_limit_value_check CHECK (limit_value >= -1);

ALTER TABLE public.organization_plan_limits
  DROP CONSTRAINT IF EXISTS organization_plan_limits_plan_check,
  DROP CONSTRAINT IF EXISTS organization_plan_limits_feature_check,
  DROP CONSTRAINT IF EXISTS organization_plan_limits_limit_value_check,
  ADD  CONSTRAINT organization_plan_limits_plan_check
       CHECK (plan IN ('trial', 'advance', 'pro', 'enterprise')),
  ADD  CONSTRAINT organization_plan_limits_feature_check
       CHECK (feature IN (
         'beneficiaries', 'redeemable_products', 'push_notifications_monthly',
         'cashiers', 'branches', 'collaborators',
         'beneficiary_map', 'exports', 'private_club', 'virtual_cashier',
         'campaigns', 'api', 'webhooks', 'sso', 'white_label',
         'advanced_roles', 'audit', 'erp_integration', 'sla',
         'priority_support', 'trained_ai', 'account_manager'
       )),
  ADD  CONSTRAINT organization_plan_limits_limit_value_check CHECK (limit_value >= -1);

-- 3. Re-siembra completa ----------------------------------------------------
DELETE FROM public.plan_limits;

INSERT INTO public.plan_limits (plan, feature, limit_value) VALUES
  -- cuotas             trial  advance   pro      enterprise
  ('trial','beneficiaries',100),('advance','beneficiaries',1000),('pro','beneficiaries',-1),('enterprise','beneficiaries',-1),
  ('trial','redeemable_products',2),('advance','redeemable_products',6),('pro','redeemable_products',20),('enterprise','redeemable_products',-1),
  ('trial','push_notifications_monthly',200),('advance','push_notifications_monthly',2000),('pro','push_notifications_monthly',5000),('enterprise','push_notifications_monthly',10000),
  ('trial','cashiers',1),('advance','cashiers',10),('pro','cashiers',50),('enterprise','cashiers',-1),
  ('trial','branches',1),('advance','branches',10),('pro','branches',50),('enterprise','branches',-1),
  ('trial','collaborators',0),('advance','collaborators',1),('pro','collaborators',-1),('enterprise','collaborators',-1),
  -- flags: 1 = incluido, 0 = no incluido
  ('trial','beneficiary_map',0),('advance','beneficiary_map',1),('pro','beneficiary_map',1),('enterprise','beneficiary_map',1),
  ('trial','exports',0),('advance','exports',1),('pro','exports',1),('enterprise','exports',1),
  ('trial','private_club',0),('advance','private_club',0),('pro','private_club',1),('enterprise','private_club',1),
  ('trial','virtual_cashier',0),('advance','virtual_cashier',1),('pro','virtual_cashier',1),('enterprise','virtual_cashier',1),
  ('trial','campaigns',0),('advance','campaigns',0),('pro','campaigns',1),('enterprise','campaigns',1),
  ('trial','api',0),('advance','api',0),('pro','api',0),('enterprise','api',1),
  ('trial','webhooks',0),('advance','webhooks',0),('pro','webhooks',0),('enterprise','webhooks',1),
  ('trial','sso',0),('advance','sso',0),('pro','sso',0),('enterprise','sso',1),
  ('trial','white_label',0),('advance','white_label',0),('pro','white_label',0),('enterprise','white_label',1),
  ('trial','advanced_roles',0),('advance','advanced_roles',0),('pro','advanced_roles',0),('enterprise','advanced_roles',1),
  ('trial','audit',0),('advance','audit',0),('pro','audit',0),('enterprise','audit',1),
  ('trial','erp_integration',0),('advance','erp_integration',0),('pro','erp_integration',0),('enterprise','erp_integration',1),
  ('trial','sla',0),('advance','sla',0),('pro','sla',0),('enterprise','sla',1),
  ('trial','priority_support',0),('advance','priority_support',0),('pro','priority_support',0),('enterprise','priority_support',1),
  ('trial','trained_ai',0),('advance','trained_ai',0),('pro','trained_ai',0),('enterprise','trained_ai',1),
  ('trial','account_manager',0),('advance','account_manager',0),('pro','account_manager',0),('enterprise','account_manager',1);

-- Las orgs existentes se re-snapshotean contra la plantilla nueva: hasta
-- ahora arrastraban sólo 6 features y valores viejos.
DELETE FROM public.organization_plan_limits;

INSERT INTO public.organization_plan_limits
  (organization_id, plan, feature, limit_value, warning_threshold, snapshotted_at)
SELECT o.id, o.plan, pl.feature, pl.limit_value, pl.warning_threshold, now()
FROM public.organization o
JOIN public.plan_limits pl ON pl.plan = o.plan;

-- 4. Funciones: entender -1 = sin límite -----------------------------------
CREATE OR REPLACE FUNCTION public.check_plan_limit(org_id BIGINT, feature_name TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_plan              TEXT;
  v_limit_value       INTEGER;
  v_warning_threshold NUMERIC(4,3);
  v_current_usage     BIGINT := 0;
  v_role_id           BIGINT;
BEGIN
  SELECT plan INTO v_plan FROM public.organization WHERE id = org_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Organization not found');
  END IF;

  SELECT opl.limit_value, opl.warning_threshold
    INTO v_limit_value, v_warning_threshold
    FROM public.organization_plan_limits opl
    WHERE opl.organization_id = org_id AND opl.feature = feature_name;

  IF NOT FOUND THEN
    SELECT pl.limit_value, pl.warning_threshold
      INTO v_limit_value, v_warning_threshold
      FROM public.plan_limits pl
      WHERE pl.plan = v_plan AND pl.feature = feature_name;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('allowed', true, 'reason', 'Feature not limited on this plan');
    END IF;
  END IF;

  CASE feature_name
    WHEN 'beneficiaries' THEN
      SELECT COUNT(*) INTO v_current_usage
        FROM public.beneficiary_organization
        WHERE organization_id = org_id AND is_active = true;

    WHEN 'push_notifications_monthly' THEN
      v_current_usage := COALESCE((
        SELECT notifications_sent_this_month
        FROM public.organization_notification_limits
        WHERE organization_id = org_id
      ), 0);

    WHEN 'cashiers' THEN
      SELECT id INTO v_role_id FROM public.user_role WHERE name = 'cashier';
      SELECT COUNT(*) INTO v_current_usage
        FROM public.app_user
        WHERE organization_id = org_id AND role_id = v_role_id AND active = true;

    WHEN 'branches' THEN
      SELECT COUNT(*) INTO v_current_usage
        FROM public.branch
        WHERE organization_id = org_id AND active = true;

    WHEN 'collaborators' THEN
      SELECT id INTO v_role_id FROM public.user_role WHERE name = 'collaborator';
      SELECT COUNT(*) INTO v_current_usage
        FROM public.app_user
        WHERE organization_id = org_id AND role_id = v_role_id AND active = true;

    -- product no tiene columna "active" (ver 20260422)
    WHEN 'redeemable_products' THEN
      SELECT COUNT(*) INTO v_current_usage
        FROM public.product
        WHERE organization_id = org_id;

    -- Los flags no tienen contador: 0 usado contra 1 (incluido) o 0 (no incluido).
    ELSE
      v_current_usage := 0;
  END CASE;

  RETURN jsonb_build_object(
    'allowed',          v_limit_value < 0 OR v_current_usage < v_limit_value,
    'current_usage',    v_current_usage,
    'limit_value',      v_limit_value,
    'usage_percentage', CASE WHEN v_limit_value < 0 THEN 0
                        WHEN v_limit_value = 0 THEN 100
                        ELSE LEAST(100, ROUND(v_current_usage::NUMERIC / v_limit_value * 100)) END,
    'should_warn',      v_limit_value > 0
                        AND v_current_usage::NUMERIC / v_limit_value >= v_warning_threshold,
    'plan',             v_plan,
    'feature',          feature_name
  );
END;
$function$;

-- El resumen de uso sigue siendo sólo sobre las cuotas contables: los flags
-- no tienen barra de consumo (y con limit_value 0 marcarían "límite alcanzado"
-- para siempre).
CREATE OR REPLACE FUNCTION public.get_organization_usage_summary(org_id BIGINT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_plan                  TEXT;
  v_beneficiaries         BIGINT  := 0;
  v_notifications_month   INTEGER := 0;
  v_cashier_role_id       BIGINT;
  v_collaborator_role_id  BIGINT;
  v_cashiers              BIGINT  := 0;
  v_branches              BIGINT  := 0;
  v_collaborators         BIGINT  := 0;
  v_products              BIGINT  := 0;
  result                  JSONB;
BEGIN
  SELECT plan INTO v_plan FROM public.organization WHERE id = org_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Organization not found');
  END IF;

  SELECT COUNT(*) INTO v_beneficiaries
    FROM public.beneficiary_organization
    WHERE organization_id = org_id AND is_active = true;

  v_notifications_month := COALESCE((
    SELECT notifications_sent_this_month
    FROM public.organization_notification_limits
    WHERE organization_id = org_id
  ), 0);

  SELECT id INTO v_cashier_role_id      FROM public.user_role WHERE name = 'cashier';
  SELECT id INTO v_collaborator_role_id FROM public.user_role WHERE name = 'collaborator';

  SELECT COUNT(*) INTO v_cashiers
    FROM public.app_user
    WHERE organization_id = org_id AND role_id = v_cashier_role_id AND active = true;

  SELECT COUNT(*) INTO v_branches
    FROM public.branch
    WHERE organization_id = org_id AND active = true;

  SELECT COUNT(*) INTO v_collaborators
    FROM public.app_user
    WHERE organization_id = org_id AND role_id = v_collaborator_role_id AND active = true;

  -- product no tiene columna "active" (ver 20260422)
  SELECT COUNT(*) INTO v_products
    FROM public.product
    WHERE organization_id = org_id;

  SELECT jsonb_build_object(
    'plan', v_plan,
    'features', jsonb_agg(
      jsonb_build_object(
        'feature',           limits.feature,
        'limit_value',       limits.limit_value,
        'warning_threshold', limits.warning_threshold,
        'current_usage',     limits.used,
        'is_at_limit',       limits.limit_value >= 0 AND limits.used >= limits.limit_value,
        'should_warn',       limits.limit_value > 0
                             AND limits.used::NUMERIC / limits.limit_value >= limits.warning_threshold,
        'usage_percentage',  CASE WHEN limits.limit_value < 0 THEN 0
                             WHEN limits.limit_value = 0 THEN 100
                             ELSE LEAST(100, ROUND(limits.used::NUMERIC / limits.limit_value * 100)) END
      )
      ORDER BY limits.feature
    )
  ) INTO result
  FROM (
    SELECT pl.feature,
           COALESCE(opl.limit_value, pl.limit_value) AS limit_value,
           COALESCE(opl.warning_threshold, pl.warning_threshold) AS warning_threshold,
           CASE pl.feature
             WHEN 'beneficiaries'              THEN v_beneficiaries
             WHEN 'push_notifications_monthly' THEN v_notifications_month
             WHEN 'cashiers'                   THEN v_cashiers
             WHEN 'branches'                   THEN v_branches
             WHEN 'collaborators'              THEN v_collaborators
             WHEN 'redeemable_products'        THEN v_products
           END AS used
    FROM public.plan_limits pl
    LEFT JOIN public.organization_plan_limits opl
      ON opl.organization_id = org_id AND opl.feature = pl.feature
    WHERE pl.plan = v_plan
      AND pl.feature IN ('beneficiaries', 'push_notifications_monthly', 'cashiers',
                         'branches', 'collaborators', 'redeemable_products')
  ) limits;

  RETURN result;
END;
$function$;

-- 5. El trigger de notificaciones necesita conocer enterprise ---------------
CREATE OR REPLACE FUNCTION public.sync_notification_limits_on_plan_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_monthly_limit  INTEGER;
  v_daily_limit    INTEGER;
  v_min_hours      INTEGER;
  v_plan_type_str  TEXT;
BEGIN
  IF OLD.plan = NEW.plan THEN
    RETURN NEW;
  END IF;

  CASE NEW.plan
    WHEN 'trial' THEN
      v_daily_limit := 1;  v_min_hours := 24; v_plan_type_str := 'free';
    WHEN 'advance' THEN
      v_daily_limit := 2;  v_min_hours := 12; v_plan_type_str := 'light';
    WHEN 'pro' THEN
      v_daily_limit := 5;  v_min_hours := 4;  v_plan_type_str := 'pro';
    WHEN 'enterprise' THEN
      v_daily_limit := 10; v_min_hours := 1;  v_plan_type_str := 'premium';
    ELSE
      v_daily_limit := 1;  v_min_hours := 24; v_plan_type_str := 'free';
  END CASE;

  SELECT limit_value INTO v_monthly_limit
    FROM public.plan_limits
    WHERE plan = NEW.plan AND feature = 'push_notifications_monthly';

  INSERT INTO public.organization_notification_limits (
    organization_id, plan_type, daily_limit, monthly_limit,
    min_hours_between_notifications
  ) VALUES (
    NEW.id, v_plan_type_str, v_daily_limit, COALESCE(v_monthly_limit, 200), v_min_hours
  )
  ON CONFLICT (organization_id) DO UPDATE SET
    plan_type                       = EXCLUDED.plan_type,
    daily_limit                     = EXCLUDED.daily_limit,
    monthly_limit                   = EXCLUDED.monthly_limit,
    min_hours_between_notifications = EXCLUDED.min_hours_between_notifications,
    updated_at                      = NOW();

  RETURN NEW;
END;
$$;

-- Las orgs actuales todavía tienen el cupo mensual viejo (3/10/50).
UPDATE public.organization_notification_limits onl
SET monthly_limit = pl.limit_value,
    updated_at    = NOW()
FROM public.organization o
JOIN public.plan_limits pl
  ON pl.plan = o.plan AND pl.feature = 'push_notifications_monthly'
WHERE onl.organization_id = o.id;
