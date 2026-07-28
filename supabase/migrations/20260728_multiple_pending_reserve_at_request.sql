-- =====================================================================
-- Multiple concurrent pending redemptions per beneficiary
-- =====================================================================
-- Previous model (20260610): one pending per beneficiary, points+stock
-- debited at DELIVERY. That single-pending lock existed only because
-- nothing was reserved at request time, so N pendings could oversell a
-- beneficiary's points.
--
-- New model: RESERVE at request, RELEASE on cancel.
--   * pending   -- points debited AND one stock unit reserved right away.
--   * delivered -- physical hand-off only; no points/stock movement.
--   * cancelled -- refund points and restore the reserved stock unit.
-- A beneficiary can now hold as many pendings as their points + available
-- stock allow, and pick them up together or separately.
-- =====================================================================

-- 1. Track which stock row a pending redemption reserved, so cancel can
--    restore the exact unit. (Stock is treated as fungible across branches
--    elsewhere, but exact restore is free once we store the id.)
ALTER TABLE public.redemption
  ADD COLUMN IF NOT EXISTS reserved_stock_id bigint NULL REFERENCES public.stock(id);

-- 2. Drop the single-pending constraint.
DROP INDEX IF EXISTS public.redemption_one_pending_per_beneficiary;

-- 3. request_redemption: reserve points + one stock unit atomically ----
CREATE OR REPLACE FUNCTION public.request_redemption(
  p_beneficiary_id bigint,
  p_product_id bigint,
  p_organization_id bigint
)
RETURNS public.redemption
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  v_product    public.product%ROWTYPE;
  v_membership public.beneficiary_organization%ROWTYPE;
  v_stock_id   bigint;
  v_redemption public.redemption%ROWTYPE;
BEGIN
  -- Authorize: the caller must be the beneficiary themselves OR staff of the
  -- organization. Since this debits points, we must NOT trust p_beneficiary_id.
  IF NOT (
    EXISTS (
      SELECT 1 FROM public.beneficiary b
      WHERE b.id = p_beneficiary_id AND b.auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.app_user au
      JOIN public.user_role ur ON ur.id = au.role_id
      WHERE au.auth_user_id = auth.uid()
        AND au.organization_id = p_organization_id
        AND ur.name = ANY (ARRAY['cashier'::user_role_type, 'owner'::user_role_type,
                                 'collaborator'::user_role_type, 'admin'::user_role_type])
    )
  ) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_product
  FROM public.product
  WHERE id = p_product_id AND organization_id = p_organization_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'PRODUCT_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  -- Lock the membership row so concurrent canjes by the same beneficiary
  -- serialize on the points balance (prevents oversell across requests).
  SELECT * INTO v_membership
  FROM public.beneficiary_organization
  WHERE beneficiary_id = p_beneficiary_id
    AND organization_id = p_organization_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'MEMBERSHIP_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;
  IF v_membership.is_active IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'MEMBERSHIP_INACTIVE' USING ERRCODE = 'P0001';
  END IF;
  IF COALESCE(v_membership.available_points, 0) < v_product.required_points THEN
    RAISE EXCEPTION 'INSUFFICIENT_POINTS' USING ERRCODE = 'P0001';
  END IF;

  -- Reserve one unit of stock (lock the first available row).
  SELECT id INTO v_stock_id
  FROM public.stock
  WHERE product_id = p_product_id AND quantity > 0
  ORDER BY id
  LIMIT 1
  FOR UPDATE;
  IF v_stock_id IS NULL THEN
    RAISE EXCEPTION 'OUT_OF_STOCK' USING ERRCODE = 'P0001';
  END IF;
  UPDATE public.stock SET quantity = quantity - 1 WHERE id = v_stock_id;

  -- Debit points now (membership row already locked above).
  UPDATE public.beneficiary_organization
  SET available_points      = available_points - v_product.required_points,
      total_points_redeemed = total_points_redeemed + v_product.required_points,
      updated_at            = now()
  WHERE beneficiary_id = p_beneficiary_id
    AND organization_id = p_organization_id;

  INSERT INTO public.redemption (
    beneficiary_id, product_id, organization_id, points_used, quantity,
    reserved_stock_id, status, requested_at, redemption_date
  ) VALUES (
    p_beneficiary_id, p_product_id, p_organization_id,
    v_product.required_points, 1, v_stock_id, 'pending', now(), now()
  )
  RETURNING * INTO v_redemption;

  RETURN v_redemption;
END;
$$;

-- 4. deliver_redemption: physical hand-off only (nothing moves) --------
CREATE OR REPLACE FUNCTION public.deliver_redemption(
  p_redemption_id bigint
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

  -- Only staff of the redemption's organization can hand a product over.
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

  v_app_user_id := private.current_app_user_id();

  UPDATE public.redemption
  SET status          = 'delivered',
      delivered_at    = now(),
      delivered_by    = v_app_user_id,
      redemption_date = now()
  WHERE id = p_redemption_id
  RETURNING * INTO v_redemption;

  RETURN v_redemption;
END;
$$;

-- 5. cancel_redemption: refund points + restore reserved stock ---------
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

  -- The beneficiary may cancel their own pending canje (get a refund), or org
  -- staff may cancel it.
  IF NOT (
    EXISTS (
      SELECT 1 FROM public.beneficiary b
      WHERE b.id = v_redemption.beneficiary_id AND b.auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.app_user au
      JOIN public.user_role ur ON ur.id = au.role_id
      WHERE au.auth_user_id = auth.uid()
        AND au.organization_id = v_redemption.organization_id
        AND ur.name = ANY (ARRAY['cashier'::user_role_type, 'owner'::user_role_type,
                                 'collaborator'::user_role_type, 'admin'::user_role_type])
    )
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

-- 6. Lock down execution: authenticated only (functions self-authorize).
--    Revoke the default PUBLIC/anon EXECUTE so these cannot be called anonymously.
REVOKE EXECUTE ON FUNCTION public.request_redemption(bigint, bigint, bigint) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.deliver_redemption(bigint) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.cancel_redemption(bigint, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.request_redemption(bigint, bigint, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deliver_redemption(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_redemption(bigint, text) TO authenticated;
