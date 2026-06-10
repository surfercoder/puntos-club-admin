-- =====================================================================
-- Two-step redemption lifecycle: pending -> delivered (or cancelled)
-- =====================================================================
-- Until now a row in public.redemption was an immutable "completed" event
-- and the INSERT trigger decremented stock immediately. We now want:
--   * pending  -- cashier (or admin) recorded the request, nothing moved yet
--   * delivered -- cashier handed the product to the beneficiary; stock and
--                  points are debited atomically at this point
--   * cancelled -- the cashier abandoned the pending request; no movement
-- A beneficiary can have at most one pending redemption at a time (globally
-- across all organizations) so they can't double-spend across cashiers.
-- =====================================================================

-- 1. Add lifecycle columns to redemption ------------------------------
ALTER TABLE public.redemption
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'delivered', 'cancelled')),
  ADD COLUMN IF NOT EXISTS requested_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS delivered_by bigint NULL REFERENCES public.app_user(id),
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS cancelled_by bigint NULL REFERENCES public.app_user(id),
  ADD COLUMN IF NOT EXISTS cancellation_reason text NULL;

-- 2. Backfill historical rows as already-delivered --------------------
-- All pre-existing rows represent completed redemptions under the old model.
UPDATE public.redemption
SET status = 'delivered',
    delivered_at = COALESCE(delivered_at, redemption_date),
    requested_at = COALESCE(requested_at, redemption_date)
WHERE status = 'pending'
  AND delivered_at IS NULL;

-- 3. One pending redemption per beneficiary at a time (globally) ------
CREATE UNIQUE INDEX IF NOT EXISTS redemption_one_pending_per_beneficiary
  ON public.redemption (beneficiary_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS redemption_status_org_idx
  ON public.redemption (organization_id, status);

-- 4. Drop the old INSERT-time stock trigger ---------------------------
-- Stock now moves only inside deliver_redemption().
DROP TRIGGER IF EXISTS trg_decrement_stock_on_redemption ON public.redemption;
DROP FUNCTION IF EXISTS public.decrement_stock_on_redemption();

-- 5. Helper: resolve the calling app_user.id --------------------------
CREATE OR REPLACE FUNCTION private.current_app_user_id()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT id FROM public.app_user WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- 6. RPC: request_redemption -----------------------------------------
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
  v_product       public.product%ROWTYPE;
  v_membership    public.beneficiary_organization%ROWTYPE;
  v_total_stock   integer;
  v_redemption    public.redemption%ROWTYPE;
BEGIN
  -- Load product (must belong to the organization)
  SELECT * INTO v_product
  FROM public.product
  WHERE id = p_product_id AND organization_id = p_organization_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'PRODUCT_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  -- Load beneficiary membership for this org
  SELECT * INTO v_membership
  FROM public.beneficiary_organization
  WHERE beneficiary_id = p_beneficiary_id
    AND organization_id = p_organization_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'MEMBERSHIP_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;
  IF v_membership.is_active IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'MEMBERSHIP_INACTIVE' USING ERRCODE = 'P0001';
  END IF;

  IF COALESCE(v_membership.available_points, 0) < v_product.required_points THEN
    RAISE EXCEPTION 'INSUFFICIENT_POINTS' USING ERRCODE = 'P0001';
  END IF;

  -- Stock check: at least one unit somewhere for this product
  SELECT COALESCE(SUM(quantity), 0) INTO v_total_stock
  FROM public.stock
  WHERE product_id = p_product_id;
  IF v_total_stock < 1 THEN
    RAISE EXCEPTION 'OUT_OF_STOCK' USING ERRCODE = 'P0001';
  END IF;

  -- Insert the pending row; the partial unique index enforces "only one pending"
  BEGIN
    INSERT INTO public.redemption (
      beneficiary_id, product_id, organization_id, points_used, quantity,
      status, requested_at, redemption_date
    ) VALUES (
      p_beneficiary_id, p_product_id, p_organization_id,
      v_product.required_points, 1,
      'pending', now(), now()
    )
    RETURNING * INTO v_redemption;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'PENDING_REDEMPTION_EXISTS' USING ERRCODE = 'P0001';
  END;

  RETURN v_redemption;
END;
$$;

-- 7. RPC: deliver_redemption -----------------------------------------
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
  v_stock_id    bigint;
  v_app_user_id bigint;
BEGIN
  -- Lock the redemption row
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

  -- Pick the first stock row with quantity > 0 (mirrors prior trigger behavior)
  SELECT id INTO v_stock_id
  FROM public.stock
  WHERE product_id = v_redemption.product_id
    AND quantity > 0
  ORDER BY id
  LIMIT 1
  FOR UPDATE;
  IF v_stock_id IS NULL THEN
    RAISE EXCEPTION 'OUT_OF_STOCK' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.stock
  SET quantity = quantity - COALESCE(v_redemption.quantity, 1)
  WHERE id = v_stock_id;

  -- Debit beneficiary points; the available_points >= 0 check guards races
  BEGIN
    UPDATE public.beneficiary_organization
    SET available_points       = available_points - v_redemption.points_used,
        total_points_redeemed  = total_points_redeemed + v_redemption.points_used,
        updated_at             = now()
    WHERE beneficiary_id   = v_redemption.beneficiary_id
      AND organization_id  = v_redemption.organization_id;
  EXCEPTION WHEN check_violation THEN
    RAISE EXCEPTION 'INSUFFICIENT_POINTS' USING ERRCODE = 'P0001';
  END;

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

-- 8. RPC: cancel_redemption ------------------------------------------
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

-- 9. Grants ----------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.request_redemption(bigint, bigint, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deliver_redemption(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_redemption(bigint, text) TO authenticated;

-- 10. Realtime publication -------------------------------------------
-- Add redemption to realtime so cashier "pendientes" list and beneficiary
-- history both update live as status changes.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'redemption'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.redemption;
  END IF;
END $$;
