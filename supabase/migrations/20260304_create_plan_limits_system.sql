-- ============================================================
-- Plan Limits System
-- Adds feature-level quota tracking and enforcement across all
-- subscription tiers (trial, advance, pro).
-- ============================================================

-- 1. plan_limits — source of truth for every plan/feature quota
-- Admins can adjust limits without a code deployment.
CREATE TABLE IF NOT EXISTS public.plan_limits (
  id                 BIGSERIAL PRIMARY KEY,
  plan               TEXT NOT NULL CHECK (plan IN ('trial', 'advance', 'pro')),
  feature            TEXT NOT NULL CHECK (feature IN (
                       'beneficiaries',
                       'push_notifications_monthly',
                       'cashiers',
                       'branches',
                       'collaborators',
                       'redeemable_products'
                     )),
  limit_value        INTEGER      NOT NULL CHECK (limit_value >= 0),
  -- fraction at which a "approaching limit" warning is shown (default 80 %)
  warning_threshold  NUMERIC(4,3) NOT NULL DEFAULT 0.800,
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (plan, feature)
);

-- 2. Seed limits (mirrors the onboarding plan-selection UI)
INSERT INTO public.plan_limits (plan, feature, limit_value) VALUES
  -- Trial
  ('trial',   'beneficiaries',              100),
  ('trial',   'push_notifications_monthly',   3),
  ('trial',   'cashiers',                     1),
  ('trial',   'branches',                     1),
  ('trial',   'collaborators',                1),
  ('trial',   'redeemable_products',          2),
  -- Advance
  ('advance', 'beneficiaries',             500),
  ('advance', 'push_notifications_monthly', 10),
  ('advance', 'cashiers',                   10),
  ('advance', 'branches',                    5),
  ('advance', 'collaborators',               3),
  ('advance', 'redeemable_products',        10),
  -- Pro
  ('pro',     'beneficiaries',            5000),
  ('pro',     'push_notifications_monthly', 50),
  ('pro',     'cashiers',                  100),
  ('pro',     'branches',                   15),
  ('pro',     'collaborators',              10),
  ('pro',     'redeemable_products',        30)
ON CONFLICT (plan, feature) DO NOTHING;

-- 3. RLS — authenticated users can read all plan limits (public catalogue)
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_plan_limits"
  ON public.plan_limits FOR SELECT
  USING (auth.role() = 'authenticated');

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_plan_limits_plan    ON public.plan_limits(plan);
CREATE INDEX IF NOT EXISTS idx_plan_limits_feature ON public.plan_limits(feature);

-- ============================================================
-- 5. Trigger: keep organization_notification_limits in sync
--    whenever organization.plan changes (e.g. after MP webhook)
-- ============================================================
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
  -- Skip if plan didn't actually change
  IF OLD.plan = NEW.plan THEN
    RETURN NEW;
  END IF;

  -- Map org plan → notification-specific fields
  CASE NEW.plan
    WHEN 'trial' THEN
      v_daily_limit   := 1;
      v_min_hours     := 24;
      v_plan_type_str := 'free';
    WHEN 'advance' THEN
      v_daily_limit   := 2;
      v_min_hours     := 12;
      v_plan_type_str := 'light';
    WHEN 'pro' THEN
      v_daily_limit   := 5;
      v_min_hours     := 4;
      v_plan_type_str := 'pro';
    ELSE
      v_daily_limit   := 1;
      v_min_hours     := 24;
      v_plan_type_str := 'free';
  END CASE;

  SELECT limit_value INTO v_monthly_limit
    FROM public.plan_limits
    WHERE plan = NEW.plan AND feature = 'push_notifications_monthly';

  INSERT INTO public.organization_notification_limits (
    organization_id,
    plan_type,
    daily_limit,
    monthly_limit,
    min_hours_between_notifications
  ) VALUES (
    NEW.id,
    v_plan_type_str,
    v_daily_limit,
    COALESCE(v_monthly_limit, 3),
    v_min_hours
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

DROP TRIGGER IF EXISTS trg_sync_notification_limits ON public.organization;

CREATE TRIGGER trg_sync_notification_limits
  AFTER UPDATE OF plan ON public.organization
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_notification_limits_on_plan_change();

-- ============================================================
-- 6. get_organization_usage_summary(org_id)
--    Returns full usage vs. limits for every feature.
--    Called by the dashboard to display the usage widget.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_organization_usage_summary(org_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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

  -- Live counts from actual tables
  SELECT COUNT(*) INTO v_beneficiaries
    FROM public.beneficiary_organization
    WHERE organization_id = org_id AND is_active = true;

  -- Subquery form ensures variable keeps default (0) when no row exists
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

  SELECT COUNT(*) INTO v_products
    FROM public.product
    WHERE organization_id = org_id AND active = true;

  -- Assemble JSON, one object per feature row in plan_limits
  SELECT jsonb_build_object(
    'plan', v_plan,
    'features', jsonb_agg(
      jsonb_build_object(
        'feature',           pl.feature,
        'limit_value',       pl.limit_value,
        'warning_threshold', pl.warning_threshold,
        'current_usage', CASE pl.feature
          WHEN 'beneficiaries'              THEN v_beneficiaries
          WHEN 'push_notifications_monthly' THEN v_notifications_month
          WHEN 'cashiers'                   THEN v_cashiers
          WHEN 'branches'                   THEN v_branches
          WHEN 'collaborators'              THEN v_collaborators
          WHEN 'redeemable_products'        THEN v_products
          ELSE 0
        END,
        'is_at_limit', CASE pl.feature
          WHEN 'beneficiaries'              THEN v_beneficiaries       >= pl.limit_value
          WHEN 'push_notifications_monthly' THEN v_notifications_month >= pl.limit_value
          WHEN 'cashiers'                   THEN v_cashiers            >= pl.limit_value
          WHEN 'branches'                   THEN v_branches            >= pl.limit_value
          WHEN 'collaborators'              THEN v_collaborators       >= pl.limit_value
          WHEN 'redeemable_products'        THEN v_products            >= pl.limit_value
          ELSE false
        END,
        'should_warn', CASE pl.feature
          WHEN 'beneficiaries'              THEN v_beneficiaries::NUMERIC       / NULLIF(pl.limit_value,0) >= pl.warning_threshold
          WHEN 'push_notifications_monthly' THEN v_notifications_month::NUMERIC / NULLIF(pl.limit_value,0) >= pl.warning_threshold
          WHEN 'cashiers'                   THEN v_cashiers::NUMERIC            / NULLIF(pl.limit_value,0) >= pl.warning_threshold
          WHEN 'branches'                   THEN v_branches::NUMERIC            / NULLIF(pl.limit_value,0) >= pl.warning_threshold
          WHEN 'collaborators'              THEN v_collaborators::NUMERIC       / NULLIF(pl.limit_value,0) >= pl.warning_threshold
          WHEN 'redeemable_products'        THEN v_products::NUMERIC            / NULLIF(pl.limit_value,0) >= pl.warning_threshold
          ELSE false
        END,
        'usage_percentage', LEAST(100, ROUND(
          CASE pl.feature
            WHEN 'beneficiaries'              THEN v_beneficiaries::NUMERIC       / NULLIF(pl.limit_value,0) * 100
            WHEN 'push_notifications_monthly' THEN v_notifications_month::NUMERIC / NULLIF(pl.limit_value,0) * 100
            WHEN 'cashiers'                   THEN v_cashiers::NUMERIC            / NULLIF(pl.limit_value,0) * 100
            WHEN 'branches'                   THEN v_branches::NUMERIC            / NULLIF(pl.limit_value,0) * 100
            WHEN 'collaborators'              THEN v_collaborators::NUMERIC       / NULLIF(pl.limit_value,0) * 100
            WHEN 'redeemable_products'        THEN v_products::NUMERIC            / NULLIF(pl.limit_value,0) * 100
            ELSE 0
          END
        ))
      )
      ORDER BY pl.feature
    )
  ) INTO result
  FROM public.plan_limits pl
  WHERE pl.plan = v_plan;

  RETURN result;
END;
$$;

-- ============================================================
-- 7. check_plan_limit(org_id, feature_name)
--    Returns whether creating one more entity of a given feature
--    is allowed under the org's current plan.
--    Used by server actions before insert operations.
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_plan_limit(org_id BIGINT, feature_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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

  SELECT limit_value, warning_threshold
    INTO v_limit_value, v_warning_threshold
    FROM public.plan_limits
    WHERE plan = v_plan AND feature = feature_name;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', true, 'reason', 'Feature not limited on this plan');
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

    WHEN 'redeemable_products' THEN
      SELECT COUNT(*) INTO v_current_usage
        FROM public.product
        WHERE organization_id = org_id AND active = true;

    ELSE
      v_current_usage := 0;
  END CASE;

  RETURN jsonb_build_object(
    'allowed',          v_current_usage < v_limit_value,
    'current_usage',    v_current_usage,
    'limit_value',      v_limit_value,
    'usage_percentage', LEAST(100, ROUND(v_current_usage::NUMERIC / NULLIF(v_limit_value,0) * 100)),
    'should_warn',      v_current_usage::NUMERIC / NULLIF(v_limit_value,0) >= v_warning_threshold,
    'plan',             v_plan,
    'feature',          feature_name
  );
END;
$$;
