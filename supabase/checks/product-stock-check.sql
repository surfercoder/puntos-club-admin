-- Self-check for the product.stock redemption lifecycle (migration
-- 20260805_stock_into_product). Rolls itself back — safe to run against any
-- environment that has at least one beneficiary with points, one staff user,
-- and one in-stock product in the same organization.
--
--   psql "$DATABASE_URL" -f supabase/checks/product-stock-check.sql
--
-- Passing = it ends with `ERROR: ROLLBACK_SELF_CHECK`. Any other error is a
-- real failure.
DO $$
DECLARE
  v_ben        bigint; v_org bigint; v_prod bigint; v_staff_uid uuid; v_ben_uid uuid;
  v_stock0 int; v_stock1 int; v_stock2 int;
  v_pts0   int; v_pts1   int; v_pts2   int;
  v_red    public.redemption;
  v_msg    text; v_raised boolean;
BEGIN
  SELECT b.id, b.auth_user_id, bo.organization_id, p.id
    INTO v_ben, v_ben_uid, v_org, v_prod
  FROM beneficiary b
  JOIN beneficiary_organization bo ON bo.beneficiary_id = b.id AND bo.is_active
  JOIN product p ON p.organization_id = bo.organization_id AND p.stock > 0
  WHERE b.auth_user_id IS NOT NULL AND bo.available_points >= p.required_points
  LIMIT 1;
  ASSERT v_ben IS NOT NULL, 'no beneficiary/product fixture available to check against';

  SELECT au.auth_user_id INTO v_staff_uid
  FROM app_user au JOIN user_role ur ON ur.id = au.role_id
  WHERE au.organization_id = v_org
    AND ur.name = ANY (ARRAY['cashier','owner','collaborator','admin']::user_role_type[])
    AND au.auth_user_id IS NOT NULL
  LIMIT 1;
  ASSERT v_staff_uid IS NOT NULL, 'no staff user in the organization to check cancel against';

  SELECT stock INTO v_stock0 FROM product WHERE id = v_prod;
  SELECT available_points INTO v_pts0 FROM beneficiary_organization
    WHERE beneficiary_id = v_ben AND organization_id = v_org;

  -- 1. Reserve: request_redemption debits points AND one unit of stock.
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_ben_uid)::text, true);
  v_red := public.request_redemption(v_ben, v_prod, v_org);

  SELECT stock INTO v_stock1 FROM product WHERE id = v_prod;
  SELECT available_points INTO v_pts1 FROM beneficiary_organization
    WHERE beneficiary_id = v_ben AND organization_id = v_org;

  ASSERT v_red.status = 'pending', 'a new redemption must be pending';
  ASSERT v_stock1 = v_stock0 - 1, format('reserve must decrement stock: %s -> %s', v_stock0, v_stock1);
  ASSERT v_pts1 = v_pts0 - v_red.points_used, format('reserve must debit points: %s -> %s', v_pts0, v_pts1);

  -- 2. Release: cancel_redemption (staff-only) refunds points and stock.
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_staff_uid)::text, true);
  PERFORM public.cancel_redemption(v_red.id, 'self-check');

  SELECT stock INTO v_stock2 FROM product WHERE id = v_prod;
  SELECT available_points INTO v_pts2 FROM beneficiary_organization
    WHERE beneficiary_id = v_ben AND organization_id = v_org;

  ASSERT v_stock2 = v_stock0, format('cancel must restore stock: expected %s got %s', v_stock0, v_stock2);
  ASSERT v_pts2 = v_pts0, format('cancel must refund points: expected %s got %s', v_pts0, v_pts2);

  -- 3. A zero-stock product is not redeemable.
  UPDATE public.product SET stock = 0 WHERE id = v_prod;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_ben_uid)::text, true);
  v_raised := false;
  BEGIN
    PERFORM public.request_redemption(v_ben, v_prod, v_org);
  EXCEPTION WHEN OTHERS THEN v_msg := SQLERRM; v_raised := true;
  END;
  ASSERT v_raised AND v_msg = 'OUT_OF_STOCK', format('expected OUT_OF_STOCK, got %s', COALESCE(v_msg, '<none>'));

  -- 4. Stock can never go negative, even by hand.
  v_raised := false;
  BEGIN
    UPDATE public.product SET stock = -1 WHERE id = v_prod;
  EXCEPTION WHEN check_violation THEN v_raised := true;
  END;
  ASSERT v_raised, 'product.stock must reject negative values';

  RAISE NOTICE 'product.stock self-check PASSED';
  RAISE EXCEPTION 'ROLLBACK_SELF_CHECK';
END $$;
