-- ============================================================================
-- DATABASE CLEANUP SCRIPT
-- ============================================================================
-- Description: Comprehensive script to delete all data from the PuntosClub database
-- WARNING: This will DELETE ALL DATA. Use with caution!
-- This script preserves the schema structure and only removes data.
-- ============================================================================

-- Disable triggers temporarily to avoid cascading issues
SET session_replication_role = 'replica';

-- ============================================================================
-- DELETE DATA FROM ALL TABLES (in correct order to respect foreign keys)
-- ============================================================================

-- 1. Delete most dependent data first
DELETE FROM redemption;
DELETE FROM purchase;
DELETE FROM app_order;

-- 2. Delete stock data
DELETE FROM stock;

-- 3. Delete product catalog
DELETE FROM product;

-- 4. Delete category structure
DELETE FROM category;

-- 5. Delete points rules
DELETE FROM points_rule;

-- 6. Delete beneficiary-organization relationships
DELETE FROM beneficiary_organization;

-- 7. Delete notification data
DELETE FROM push_tokens;
DELETE FROM push_notifications;

-- 8. Delete user data
DELETE FROM beneficiary;
DELETE FROM app_user_organization;
DELETE FROM app_user;

-- ============================================================================
-- DELETE SUPABASE AUTH DATA
-- ============================================================================
-- Clear all authentication records (order matters due to foreign keys)
DELETE FROM auth.identities;
DELETE FROM auth.sessions;
DELETE FROM auth.refresh_tokens;
DELETE FROM auth.mfa_factors;
DELETE FROM auth.mfa_challenges;
DELETE FROM auth.mfa_amr_claims;
DELETE FROM auth.users;

-- 10. Delete branch and address data
DELETE FROM branch;
DELETE FROM address;

-- 11. Delete organization data
DELETE FROM organization_notification_limits;
DELETE FROM organization;

-- Re-enable triggers
SET session_replication_role = 'origin';

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
-- RESET SEQUENCES (only for tables that use integer sequences)
-- ============================================================================

DO $$
DECLARE
  seq_name text;
  seq_names text[] := ARRAY[
    'redemption_id_seq',
    'purchase_id_seq',
    'app_order_id_seq',
    'stock_id_seq',
    'product_id_seq',
    'category_id_seq',
    'points_rule_id_seq',
    'beneficiary_organization_id_seq',
    'push_tokens_id_seq',
    'push_notifications_id_seq',
    'beneficiary_id_seq',
    'app_user_organization_id_seq',
    'app_user_id_seq',
    'branch_id_seq',
    'address_id_seq',
    'organization_notification_limits_id_seq',
    'organization_id_seq'
  ];
BEGIN
  FOREACH seq_name IN ARRAY seq_names LOOP
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = seq_name) THEN
      EXECUTE format('ALTER SEQUENCE %I RESTART WITH 1', seq_name);
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- CLEANUP COMPLETE
-- ============================================================================
-- All data has been deleted and sequences have been reset.
-- The database schema remains intact and ready for fresh data.