-- Fix: product table has no "active" column, causing get_organization_usage_summary to fail.
-- Remove the "AND active = true" filter from the product count query.
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

  -- product table has no "active" column — count all products for this org
  SELECT COUNT(*) INTO v_products
    FROM public.product
    WHERE organization_id = org_id;

  -- Read from org's snapshotted limits, falling back to global template
  SELECT jsonb_build_object(
    'plan', v_plan,
    'features', jsonb_agg(
      jsonb_build_object(
        'feature',           limits.feature,
        'limit_value',       limits.limit_value,
        'warning_threshold', limits.warning_threshold,
        'current_usage', CASE limits.feature
          WHEN 'beneficiaries'              THEN v_beneficiaries
          WHEN 'push_notifications_monthly' THEN v_notifications_month
          WHEN 'cashiers'                   THEN v_cashiers
          WHEN 'branches'                   THEN v_branches
          WHEN 'collaborators'              THEN v_collaborators
          WHEN 'redeemable_products'        THEN v_products
          ELSE 0
        END,
        'is_at_limit', CASE limits.feature
          WHEN 'beneficiaries'              THEN v_beneficiaries       >= limits.limit_value
          WHEN 'push_notifications_monthly' THEN v_notifications_month >= limits.limit_value
          WHEN 'cashiers'                   THEN v_cashiers            >= limits.limit_value
          WHEN 'branches'                   THEN v_branches            >= limits.limit_value
          WHEN 'collaborators'              THEN v_collaborators       >= limits.limit_value
          WHEN 'redeemable_products'        THEN v_products            >= limits.limit_value
          ELSE false
        END,
        'should_warn', CASE limits.feature
          WHEN 'beneficiaries'              THEN v_beneficiaries::NUMERIC       / NULLIF(limits.limit_value,0) >= limits.warning_threshold
          WHEN 'push_notifications_monthly' THEN v_notifications_month::NUMERIC / NULLIF(limits.limit_value,0) >= limits.warning_threshold
          WHEN 'cashiers'                   THEN v_cashiers::NUMERIC            / NULLIF(limits.limit_value,0) >= limits.warning_threshold
          WHEN 'branches'                   THEN v_branches::NUMERIC            / NULLIF(limits.limit_value,0) >= limits.warning_threshold
          WHEN 'collaborators'              THEN v_collaborators::NUMERIC       / NULLIF(limits.limit_value,0) >= limits.warning_threshold
          WHEN 'redeemable_products'        THEN v_products::NUMERIC            / NULLIF(limits.limit_value,0) >= limits.warning_threshold
          ELSE false
        END,
        'usage_percentage', LEAST(100, ROUND(
          CASE limits.feature
            WHEN 'beneficiaries'              THEN v_beneficiaries::NUMERIC       / NULLIF(limits.limit_value,0) * 100
            WHEN 'push_notifications_monthly' THEN v_notifications_month::NUMERIC / NULLIF(limits.limit_value,0) * 100
            WHEN 'cashiers'                   THEN v_cashiers::NUMERIC            / NULLIF(limits.limit_value,0) * 100
            WHEN 'branches'                   THEN v_branches::NUMERIC            / NULLIF(limits.limit_value,0) * 100
            WHEN 'collaborators'              THEN v_collaborators::NUMERIC       / NULLIF(limits.limit_value,0) * 100
            WHEN 'redeemable_products'        THEN v_products::NUMERIC            / NULLIF(limits.limit_value,0) * 100
            ELSE 0
          END
        ))
      )
      ORDER BY limits.feature
    )
  ) INTO result
  FROM (
    -- Prefer org snapshot; fall back to global template
    SELECT COALESCE(opl.feature, pl.feature) AS feature,
           COALESCE(opl.limit_value, pl.limit_value) AS limit_value,
           COALESCE(opl.warning_threshold, pl.warning_threshold) AS warning_threshold
    FROM public.plan_limits pl
    LEFT JOIN public.organization_plan_limits opl
      ON opl.organization_id = org_id AND opl.feature = pl.feature
    WHERE pl.plan = v_plan
  ) limits;

  RETURN result;
END;
$function$;
