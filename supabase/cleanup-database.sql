-- ============================================================================
-- DATABASE CLEANUP SCRIPT
-- ============================================================================
-- Wipes ALL application data, auth users, and storage objects.
-- Preserves schema and the two reference tables required by the app:
--   - public.plan_limits
--   - public.user_role
-- Views are derived from the wiped tables and become empty automatically.
-- WARNING: DESTRUCTIVE. Intended for dev/staging resets only.
-- ============================================================================

BEGIN;

-- Bypass triggers/FK checks while we wipe everything in one shot.
SET LOCAL session_replication_role = 'replica';

-- ----------------------------------------------------------------------------
-- 1. PUBLIC SCHEMA TABLES
-- ----------------------------------------------------------------------------
-- TRUNCATE ... RESTART IDENTITY CASCADE empties every listed table, resets
-- their identity sequences, and cascades to any dependents we may have
-- missed. plan_limits and user_role are intentionally NOT listed.
TRUNCATE TABLE
  public.redemption,
  public.purchase,
  public.stock,
  public.product,
  public.category,
  public.points_rule,
  public.beneficiary_organization,
  public.beneficiary,
  public.push_tokens,
  public.push_notifications,
  public.app_user_organization,
  public.app_user,
  public.branch,
  public.address,
  public.subscription,
  public.organization_plan_limits,
  public.organization_notification_limits,
  public.organization
RESTART IDENTITY CASCADE;

-- Sequences not attached to a column identity (won't be reset by TRUNCATE).
SELECT setval('public.purchase_number_seq', 1, false);

-- ----------------------------------------------------------------------------
-- 2. STORAGE — empty every object in every bucket, keep the buckets themselves
-- ----------------------------------------------------------------------------
DELETE FROM storage.objects;

-- ----------------------------------------------------------------------------
-- 3. SUPABASE AUTH — wipe all users and related session/MFA state
-- ----------------------------------------------------------------------------
-- Child tables first; auth.users last. FK cascades cover most of this but we
-- delete explicitly so the script keeps working even if cascades change.
DELETE FROM auth.mfa_amr_claims;
DELETE FROM auth.mfa_challenges;
DELETE FROM auth.mfa_factors;
DELETE FROM auth.refresh_tokens;
DELETE FROM auth.sessions;
DELETE FROM auth.identities;
DELETE FROM auth.one_time_tokens;
DELETE FROM auth.flow_state;
DELETE FROM auth.users;

SET LOCAL session_replication_role = 'origin';

COMMIT;

-- ----------------------------------------------------------------------------
-- 4. REFRESH MATERIALIZED VIEWS (no-op today, future-proof)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN (
    SELECT schemaname, matviewname
    FROM pg_matviews
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
  ) LOOP
    EXECUTE format('REFRESH MATERIALIZED VIEW %I.%I', r.schemaname, r.matviewname);
  END LOOP;
END $$;

-- ============================================================================
-- DONE
-- ============================================================================
-- Remaining state:
--   * public.plan_limits and public.user_role: untouched (seed data)
--   * Every other public table: empty, sequences reset to 1
--   * Storage buckets: still exist, but contain zero objects
--   * Auth: zero users, sessions, identities, MFA records
-- ============================================================================
