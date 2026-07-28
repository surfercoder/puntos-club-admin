-- =====================================================================
-- cancel_redemption: staff-only cancellation
-- =====================================================================
-- Previously (20260728_multiple_pending_reserve_at_request) a beneficiary
-- could cancel their own pending canje. Business decision: cancellation is
-- now a staff-only action (more control at the counter). Only org staff may
-- cancel; the refund + stock-restore behaviour is unchanged.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.cancel_redemption(
  p_redemption_id bigint,
  p_reason text DEFAULT NULL
)
RETURNS public.redemption
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  v_redemption  public.redemption%ROWTYPE;
  v_app_user_id bigint;
BEGIN
  SELECT * INTO v_redemption
  FROM public.redemption
  WHERE id = p_redemption_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'REDEMPTION_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;
  IF v_redemption.status <> 'pending' THEN
    RAISE EXCEPTION 'REDEMPTION_NOT_PENDING' USING ERRCODE = 'P0001';
  END IF;

  -- Only org staff may cancel (beneficiaries can no longer self-cancel).
  IF NOT EXISTS (
    SELECT 1 FROM public.app_user au
    JOIN public.user_role ur ON ur.id = au.role_id
    WHERE au.auth_user_id = auth.uid()
      AND au.organization_id = v_redemption.organization_id
      AND ur.name = ANY (ARRAY['cashier'::user_role_type, 'owner'::user_role_type,
                               'collaborator'::user_role_type, 'admin'::user_role_type])
  ) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED' USING ERRCODE = '42501';
  END IF;

  -- Refund points.
  UPDATE public.beneficiary_organization
  SET available_points      = available_points + v_redemption.points_used,
      total_points_redeemed = GREATEST(0, total_points_redeemed - v_redemption.points_used),
      updated_at            = now()
  WHERE beneficiary_id  = v_redemption.beneficiary_id
    AND organization_id = v_redemption.organization_id;

  -- Restore the reserved stock unit.
  IF v_redemption.reserved_stock_id IS NOT NULL THEN
    UPDATE public.stock
    SET quantity = quantity + COALESCE(v_redemption.quantity, 1)
    WHERE id = v_redemption.reserved_stock_id;
  END IF;

  v_app_user_id := private.current_app_user_id();

  UPDATE public.redemption
  SET status              = 'cancelled',
      cancelled_at        = now(),
      cancelled_by        = v_app_user_id,
      cancellation_reason = p_reason
  WHERE id = p_redemption_id
  RETURNING * INTO v_redemption;

  RETURN v_redemption;
END;
$$;
