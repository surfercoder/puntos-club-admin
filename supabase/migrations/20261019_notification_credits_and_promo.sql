-- =====================================================================
-- Notificaciones como saldo (no se renuevan) + fin de la promo del 50%
-- =====================================================================
-- 1. Las notificaciones incluidas en un plan se otorgan UNA vez y se van
--    descontando: ya no hay reinicio mensual. El saldo es un libro de
--    cargas (`notification_credit`), así la futura venta de paquetes es
--    sólo otra fila con source = 'purchase'.
--      - source 'plan': lo que trae el plan (plan_limits.push_notifications_monthly).
--        Una sola vez por plan y org (índice único): bajar y volver a subir
--        no vuelve a regalar.
--      - source 'admin': lo que carga el superadmin a mano.
--    organization_notification_limits cachea el total (notifications_granted,
--    mantenido por trigger) y lo usado (notifications_used): las pantallas y
--    can_send_notification leen una sola fila.
--    Unidad: 1 envío al club = 1 notificación, como hasta ahora. Los avisos
--    automáticos (puntos, canjes) no descuentan.
--
-- 2. Cualquier usuario de la org podía hacer INSERT/UPDATE de su fila de
--    límites (o sea, ponerse lo usado en 0). Ahora sólo escriben las
--    funciones SECURITY DEFINER y el superadmin.
--
-- 3. organization.promo_ends_at: fin de los 12 meses al 50%. Corre por org
--    desde la primera suscripción autorizada (cambiar de plan no lo
--    reinicia). Lo setea activateSubscription; el cron
--    /api/cron/subscription-prices sube el monto en Mercado Pago al vencer.
-- =====================================================================

-- ── 3. Promo ──────────────────────────────────────────────────────────
ALTER TABLE public.organization ADD COLUMN IF NOT EXISTS promo_ends_at timestamptz;

-- ── 1. Saldo de notificaciones ────────────────────────────────────────
ALTER TABLE public.organization_notification_limits
  RENAME COLUMN notifications_sent_this_month TO notifications_used;
ALTER TABLE public.organization_notification_limits
  RENAME COLUMN monthly_limit TO notifications_granted;
ALTER TABLE public.organization_notification_limits
  DROP COLUMN reset_monthly_at;
ALTER TABLE public.organization_notification_limits
  ALTER COLUMN notifications_granted SET DEFAULT 0;

CREATE TABLE public.notification_credit (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id bigint NOT NULL REFERENCES public.organization(id) ON DELETE CASCADE,
  amount          integer NOT NULL CHECK (amount <> 0),
  source          text NOT NULL CHECK (source IN ('plan', 'admin', 'purchase')),
  plan            text,
  note            text,
  created_by      bigint REFERENCES public.app_user(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CHECK ((source = 'plan') = (plan IS NOT NULL))
);

CREATE UNIQUE INDEX notification_credit_plan_once
  ON public.notification_credit (organization_id, plan)
  WHERE source = 'plan';
CREATE INDEX notification_credit_org_idx ON public.notification_credit (organization_id);

ALTER TABLE public.notification_credit ENABLE ROW LEVEL SECURITY;

CREATE POLICY notification_credit_org_read ON public.notification_credit
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.app_user WHERE auth_user_id = auth.uid())
  );
CREATE POLICY notification_credit_platform_admin_read ON public.notification_credit
  FOR SELECT USING (private.is_platform_admin());
-- Sólo se suma: un ajuste a la baja es una carga negativa, nunca un UPDATE/DELETE.
CREATE POLICY notification_credit_platform_admin_insert ON public.notification_credit
  FOR INSERT WITH CHECK (private.is_platform_admin());

CREATE OR REPLACE FUNCTION private.apply_notification_credit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.organization_notification_limits (organization_id, notifications_granted)
  VALUES (NEW.organization_id, NEW.amount)
  ON CONFLICT (organization_id) DO UPDATE
    SET notifications_granted = organization_notification_limits.notifications_granted + EXCLUDED.notifications_granted,
        updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_apply_notification_credit
  AFTER INSERT ON public.notification_credit
  FOR EACH ROW EXECUTE FUNCTION private.apply_notification_credit();

-- ── 2. Nadie de la org escribe su propia fila ─────────────────────────
DROP POLICY "Users can insert their organization's notification limits" ON public.organization_notification_limits;
DROP POLICY "Users can update their organization's notification limits" ON public.organization_notification_limits;

-- ── Plan nuevo: daily/min_hours como antes + la carga única del plan ─
CREATE OR REPLACE FUNCTION public.sync_notification_limits_on_plan_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_daily_limit   INTEGER;
  v_min_hours     INTEGER;
  v_plan_type_str TEXT;
  v_included      INTEGER;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.plan IS NOT DISTINCT FROM NEW.plan THEN
    RETURN NEW;
  END IF;

  CASE NEW.plan
    WHEN 'trial'      THEN v_daily_limit := 1;  v_min_hours := 24; v_plan_type_str := 'free';
    WHEN 'advance'    THEN v_daily_limit := 2;  v_min_hours := 12; v_plan_type_str := 'light';
    WHEN 'pro'        THEN v_daily_limit := 5;  v_min_hours := 4;  v_plan_type_str := 'pro';
    WHEN 'enterprise' THEN v_daily_limit := 10; v_min_hours := 1;  v_plan_type_str := 'premium';
    ELSE                   v_daily_limit := 1;  v_min_hours := 24; v_plan_type_str := 'free';
  END CASE;

  INSERT INTO public.organization_notification_limits (
    organization_id, plan_type, daily_limit, min_hours_between_notifications
  ) VALUES (
    NEW.id, v_plan_type_str, v_daily_limit, v_min_hours
  )
  ON CONFLICT (organization_id) DO UPDATE SET
    plan_type                       = EXCLUDED.plan_type,
    daily_limit                     = EXCLUDED.daily_limit,
    min_hours_between_notifications = EXCLUDED.min_hours_between_notifications,
    updated_at                      = NOW();

  SELECT limit_value INTO v_included
    FROM public.plan_limits
    WHERE plan = NEW.plan AND feature = 'push_notifications_monthly';

  IF COALESCE(v_included, 0) > 0 THEN
    INSERT INTO public.notification_credit (organization_id, amount, source, plan, note)
    VALUES (NEW.id, v_included, 'plan', NEW.plan, 'Incluidas en el plan')
    ON CONFLICT (organization_id, plan) WHERE source = 'plan' DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- ── Arranque: todas las orgs cargan las de su plan actual, lo usado en 0 ─
UPDATE public.organization_notification_limits
SET notifications_granted = 0, notifications_used = 0, updated_at = now();

INSERT INTO public.notification_credit (organization_id, amount, source, plan, note)
SELECT o.id, pl.limit_value, 'plan', o.plan, 'Incluidas en el plan'
FROM public.organization o
JOIN public.plan_limits pl ON pl.plan = o.plan AND pl.feature = 'push_notifications_monthly'
WHERE pl.limit_value > 0;

-- ── Chequeos: el tope es el saldo, sin reinicio mensual ───────────────
CREATE OR REPLACE FUNCTION public.can_send_notification(org_id bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  limits_record RECORD;
  hours_since_last NUMERIC;
BEGIN
  SELECT * INTO limits_record FROM public.organization_notification_limits WHERE organization_id = org_id;
  IF NOT FOUND THEN RETURN FALSE; END IF;

  IF NOW() >= limits_record.reset_daily_at THEN
    UPDATE public.organization_notification_limits
    SET notifications_sent_today = 0,
        reset_daily_at = (CURRENT_DATE + INTERVAL '1 day'),
        updated_at = NOW()
    WHERE organization_id = org_id;
    limits_record.notifications_sent_today := 0;
  END IF;

  IF limits_record.notifications_sent_today >= limits_record.daily_limit THEN RETURN FALSE; END IF;
  IF limits_record.notifications_used >= limits_record.notifications_granted THEN RETURN FALSE; END IF;

  IF limits_record.last_notification_sent_at IS NOT NULL THEN
    hours_since_last := EXTRACT(EPOCH FROM (NOW() - limits_record.last_notification_sent_at)) / 3600;
    IF hours_since_last < limits_record.min_hours_between_notifications THEN RETURN FALSE; END IF;
  END IF;
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_notification_counters(org_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.organization_notification_limits
  SET notifications_sent_today = notifications_sent_today + 1,
      notifications_used = notifications_used + 1,
      last_notification_sent_at = NOW(),
      updated_at = NOW()
  WHERE organization_id = org_id;
END;
$$;

-- push_notifications_monthly: el tope es lo cargado y el uso es lo usado
-- (el snapshot del plan y plan_limits ya no aplican a esta feature).
CREATE OR REPLACE FUNCTION public.check_plan_limit(org_id bigint, feature_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan TEXT; v_limit_value INTEGER; v_warning_threshold NUMERIC(4,3);
  v_current_usage BIGINT := 0; v_role_id BIGINT;
BEGIN
  SELECT plan INTO v_plan FROM public.organization WHERE id = org_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Organization not found');
  END IF;
  SELECT opl.limit_value, opl.warning_threshold INTO v_limit_value, v_warning_threshold
    FROM public.organization_plan_limits opl
    WHERE opl.organization_id = org_id AND opl.feature = feature_name;
  IF NOT FOUND THEN
    SELECT pl.limit_value, pl.warning_threshold INTO v_limit_value, v_warning_threshold
      FROM public.plan_limits pl WHERE pl.plan = v_plan AND pl.feature = feature_name;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('allowed', true, 'reason', 'Feature not limited on this plan');
    END IF;
  END IF;
  CASE feature_name
    WHEN 'beneficiaries' THEN
      SELECT COUNT(*) INTO v_current_usage FROM public.beneficiary_organization
        WHERE organization_id = org_id AND is_active = true;
    WHEN 'push_notifications_monthly' THEN
      SELECT COALESCE(l.notifications_used, 0), COALESCE(l.notifications_granted, 0)
        INTO v_current_usage, v_limit_value
        FROM (SELECT 1) one
        LEFT JOIN public.organization_notification_limits l ON l.organization_id = org_id;
    WHEN 'cashiers' THEN
      SELECT id INTO v_role_id FROM public.user_role WHERE name = 'cashier';
      SELECT COUNT(*) INTO v_current_usage FROM public.app_user
        WHERE organization_id = org_id AND role_id = v_role_id AND active = true;
    WHEN 'branches' THEN
      SELECT COUNT(*) INTO v_current_usage FROM public.branch
        WHERE organization_id = org_id AND active = true;
    WHEN 'collaborators' THEN
      SELECT id INTO v_role_id FROM public.user_role WHERE name = 'collaborator';
      SELECT COUNT(*) INTO v_current_usage FROM public.app_user
        WHERE organization_id = org_id AND role_id = v_role_id AND active = true;
    -- product no tiene columna "active" (ver 20260422)
    WHEN 'redeemable_products' THEN
      SELECT COUNT(*) INTO v_current_usage FROM public.product WHERE organization_id = org_id;
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
$$;

CREATE OR REPLACE FUNCTION public.get_organization_usage_summary(org_id bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan TEXT; v_promo_ends_at timestamptz; v_beneficiaries BIGINT := 0;
  v_notifications_used INTEGER := 0; v_notifications_granted INTEGER := 0;
  v_cashier_role_id BIGINT; v_collaborator_role_id BIGINT;
  v_cashiers BIGINT := 0; v_branches BIGINT := 0; v_collaborators BIGINT := 0;
  v_products BIGINT := 0; result JSONB;
BEGIN
  SELECT plan, promo_ends_at INTO v_plan, v_promo_ends_at FROM public.organization WHERE id = org_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Organization not found'); END IF;

  SELECT COUNT(*) INTO v_beneficiaries FROM public.beneficiary_organization
    WHERE organization_id = org_id AND is_active = true;
  SELECT notifications_used, notifications_granted
    INTO v_notifications_used, v_notifications_granted
    FROM public.organization_notification_limits WHERE organization_id = org_id;
  -- Sin fila, SELECT INTO deja NULL.
  v_notifications_used := COALESCE(v_notifications_used, 0);
  v_notifications_granted := COALESCE(v_notifications_granted, 0);
  SELECT id INTO v_cashier_role_id FROM public.user_role WHERE name = 'cashier';
  SELECT id INTO v_collaborator_role_id FROM public.user_role WHERE name = 'collaborator';
  SELECT COUNT(*) INTO v_cashiers FROM public.app_user
    WHERE organization_id = org_id AND role_id = v_cashier_role_id AND active = true;
  SELECT COUNT(*) INTO v_branches FROM public.branch
    WHERE organization_id = org_id AND active = true;
  SELECT COUNT(*) INTO v_collaborators FROM public.app_user
    WHERE organization_id = org_id AND role_id = v_collaborator_role_id AND active = true;
  -- product no tiene columna "active" (ver 20260422)
  SELECT COUNT(*) INTO v_products FROM public.product WHERE organization_id = org_id;

  SELECT jsonb_build_object(
    'plan', v_plan,
    'promo_ends_at', v_promo_ends_at,
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
           CASE WHEN pl.feature = 'push_notifications_monthly' THEN v_notifications_granted
                ELSE COALESCE(opl.limit_value, pl.limit_value) END AS limit_value,
           COALESCE(opl.warning_threshold, pl.warning_threshold) AS warning_threshold,
           CASE pl.feature
             WHEN 'beneficiaries'              THEN v_beneficiaries
             WHEN 'push_notifications_monthly' THEN v_notifications_used
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
$$;
