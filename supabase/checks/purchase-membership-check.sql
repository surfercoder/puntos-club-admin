-- Self-check for the purchase membership guard (migration
-- 20260828_purchase_membership_guard). Rolls itself back — safe to run against
-- any environment that has one active and one inactive membership, each with a
-- branch in its organization.
--
--   psql "$DATABASE_URL" -f supabase/checks/purchase-membership-check.sql
--
-- Passing = it ends with `ERROR: ROLLBACK_SELF_CHECK`. Any other error is a
-- real failure.
-- Los ASSERT no se evaluan con plpgsql.check_asserts = off: el check pasaria
-- en vacio, asi que se fuerza on para esta sesion.
SET plpgsql.check_asserts = on;

DO $$
DECLARE
  v_ben_off bigint; v_org_off bigint; v_branch_off bigint;
  v_ben_on  bigint; v_org_on  bigint; v_branch_on  bigint;
  v_ben_new bigint;
  v_pts0 int; v_pts1 int; v_org_written bigint; v_purchase_id bigint;
  v_msg text; v_raised boolean;
BEGIN
  SELECT bo.beneficiary_id, bo.organization_id, br.id
    INTO v_ben_off, v_org_off, v_branch_off
  FROM beneficiary_organization bo
  JOIN branch br ON br.organization_id = bo.organization_id
  WHERE bo.is_active IS DISTINCT FROM true
  LIMIT 1;
  ASSERT v_ben_off IS NOT NULL, 'no inactive membership with a branch to check against';

  SELECT bo.beneficiary_id, bo.organization_id, br.id
    INTO v_ben_on, v_org_on, v_branch_on
  FROM beneficiary_organization bo
  JOIN branch br ON br.organization_id = bo.organization_id
  WHERE bo.is_active
  LIMIT 1;
  ASSERT v_ben_on IS NOT NULL, 'no active membership with a branch to check against';

  -- 1. Selling to a member who left is rejected.
  v_raised := false;
  BEGIN
    INSERT INTO public.purchase (beneficiary_id, branch_id, organization_id, total_amount, points_earned)
    VALUES (v_ben_off, v_branch_off, v_org_off, 100, 10);
  EXCEPTION WHEN OTHERS THEN v_msg := SQLERRM; v_raised := true;
  END;
  ASSERT v_raised AND v_msg = 'MEMBERSHIP_INACTIVE',
    format('expected MEMBERSHIP_INACTIVE, got %s', COALESCE(v_msg, '<none>'));

  -- 2. Same rejection when organization_id is omitted and derived from branch.
  v_raised := false;
  BEGIN
    INSERT INTO public.purchase (beneficiary_id, branch_id, total_amount, points_earned)
    VALUES (v_ben_off, v_branch_off, 100, 10);
  EXCEPTION WHEN OTHERS THEN v_msg := SQLERRM; v_raised := true;
  END;
  ASSERT v_raised AND v_msg = 'MEMBERSHIP_INACTIVE',
    format('expected MEMBERSHIP_INACTIVE without organization_id, got %s', COALESCE(v_msg, '<none>'));

  -- 3. An active member still gets the sale and the points.
  SELECT available_points INTO v_pts0 FROM beneficiary_organization
    WHERE beneficiary_id = v_ben_on AND organization_id = v_org_on;

  INSERT INTO public.purchase (beneficiary_id, branch_id, total_amount, points_earned)
  VALUES (v_ben_on, v_branch_on, 100, 10)
  RETURNING id, organization_id INTO v_purchase_id, v_org_written;

  SELECT available_points INTO v_pts1 FROM beneficiary_organization
    WHERE beneficiary_id = v_ben_on AND organization_id = v_org_on;

  ASSERT v_org_written = v_org_on,
    format('the guard must fill organization_id: expected %s got %s', v_org_on, v_org_written);
  ASSERT v_pts1 = v_pts0 + 10, format('an active member must earn points: %s -> %s', v_pts0, v_pts1);

  -- 4. Editing a sale without moving points is not revalidated.
  UPDATE public.purchase SET notes = 'self-check' WHERE id = v_purchase_id;

  -- 5. Implicit signup still works: no membership row means the points trigger
  --    creates one, same as before the guard.
  SELECT b.id INTO v_ben_new FROM beneficiary b
  WHERE NOT EXISTS (
    SELECT 1 FROM beneficiary_organization bo
    WHERE bo.beneficiary_id = b.id AND bo.organization_id = v_org_on
  )
  LIMIT 1;
  IF v_ben_new IS NOT NULL THEN
    INSERT INTO public.purchase (beneficiary_id, branch_id, total_amount, points_earned)
    VALUES (v_ben_new, v_branch_on, 100, 7);
    ASSERT EXISTS (
      SELECT 1 FROM beneficiary_organization
      WHERE beneficiary_id = v_ben_new AND organization_id = v_org_on
    ), 'selling to a non-member must still create the membership';
  END IF;

  RAISE NOTICE 'purchase membership guard self-check PASSED';
  RAISE EXCEPTION 'ROLLBACK_SELF_CHECK';
END $$;
