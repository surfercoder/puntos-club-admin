-- =====================================================================
-- Collapse the stock module into product.stock
-- =====================================================================
-- The stock table modelled quantity per (branch, product). In practice no
-- organization ever used that granularity: every product had exactly one
-- stock row. It bought a whole CRUD module, an extra join on every product
-- read, a realtime channel and a reserved_stock_id FK -- for a single
-- integer.
--
-- New model: product.stock. Set when the product is created, edited inline
-- on the product form. Reserved at request_redemption, restored at
-- cancel_redemption (same lifecycle as before, one less table).
--
-- ponytail: stock is no longer per-branch. Reintroduce a stock table only if
-- an organization actually needs per-branch quantities.
-- =====================================================================

-- 1. The column -------------------------------------------------------
ALTER TABLE public.product
  ADD COLUMN IF NOT EXISTS stock integer NOT NULL DEFAULT 0
    CONSTRAINT product_stock_non_negative CHECK (stock >= 0);

COMMENT ON COLUMN public.product.stock IS
  'Units available for redemption. Decremented on request_redemption, restored on cancel_redemption.';

-- 2. Backfill from the summed stock rows ------------------------------
UPDATE public.product p
SET stock = GREATEST(
  COALESCE((SELECT SUM(s.quantity) FROM public.stock s WHERE s.product_id = p.id), 0),
  0
);

-- 3. request_redemption: reserve one unit off product.stock -----------
--    Lock order is membership -> product, matching cancel_redemption below,
--    so the two cannot deadlock against each other.
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

  -- Reserve one unit. The conditional UPDATE takes the row lock and does the
  -- check atomically: if no row matched, stock was already 0.
  UPDATE public.product
  SET stock = stock - 1
  WHERE id = p_product_id AND stock > 0;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'OUT_OF_STOCK' USING ERRCODE = 'P0001';
  END IF;

  -- Debit points now (membership row already locked above).
  UPDATE public.beneficiary_organization
  SET available_points      = available_points - v_product.required_points,
      total_points_redeemed = total_points_redeemed + v_product.required_points,
      updated_at            = now()
  WHERE beneficiary_id = p_beneficiary_id
    AND organization_id = p_organization_id;

  INSERT INTO public.redemption (
    beneficiary_id, product_id, organization_id, points_used, quantity,
    status, requested_at, redemption_date
  ) VALUES (
    p_beneficiary_id, p_product_id, p_organization_id,
    v_product.required_points, 1, 'pending', now(), now()
  )
  RETURNING * INTO v_redemption;

  RETURN v_redemption;
END;
$$;

-- 4. cancel_redemption: refund points + restore the reserved unit ------
--    (staff-only, per 20260728_cancel_redemption_staff_only)
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

  -- Restore the reserved unit.
  IF v_redemption.product_id IS NOT NULL THEN
    UPDATE public.product
    SET stock = stock + COALESCE(v_redemption.quantity, 1)
    WHERE id = v_redemption.product_id;
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

-- deliver_redemption is unchanged: it never moved stock under the reserve-at-
-- request model, and it still doesn't.

-- 5. Drop the module --------------------------------------------------
ALTER TABLE public.redemption DROP COLUMN IF EXISTS reserved_stock_id;

ALTER PUBLICATION supabase_realtime DROP TABLE public.stock;

-- CASCADE clears the stock RLS policies along with the table.
DROP TABLE IF EXISTS public.stock CASCADE;
