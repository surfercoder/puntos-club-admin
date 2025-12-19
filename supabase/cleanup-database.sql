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

-- 1. Delete purchase-related data first (most dependent)
DELETE FROM purchase_item;
DELETE FROM purchase;

-- 2. Delete redemption and order data
DELETE FROM history;
DELETE FROM redemption;
DELETE FROM app_order;

-- 3. Delete assignment data
DELETE FROM assignment;

-- 4. Delete stock data
DELETE FROM stock;

-- 5. Delete product catalog
DELETE FROM product;
DELETE FROM purchasable_item;

-- 6. Delete category structure
DELETE FROM category;

-- 7. Delete points rules
DELETE FROM points_rule;

-- 8. Delete beneficiary-organization relationships
DELETE FROM beneficiary_organization;

-- 8b. beneficiary_stores and beneficiary_total_points are VIEWS, not tables
-- They don't store data directly, so no deletion needed
-- (Data is deleted when underlying tables are cleared)

-- 9. Delete user data
DELETE FROM beneficiary;
DELETE FROM app_user;
DELETE FROM app_user_organization;

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

-- 10. Delete permission data
DELETE FROM collaborator_permission;
DELETE FROM user_permission;
DELETE FROM restricted_collaborator_action;

-- 11. Delete branch and address data
DELETE FROM branch;
DELETE FROM address;

-- 12. Delete organization data
DELETE FROM organization;

-- 13. Delete status data
DELETE FROM status;

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
-- RESET SEQUENCES (resets auto-increment IDs to 1)
-- ============================================================================

ALTER SEQUENCE purchase_item_id_seq RESTART WITH 1;
ALTER SEQUENCE purchase_id_seq RESTART WITH 1;
ALTER SEQUENCE history_id_seq RESTART WITH 1;
ALTER SEQUENCE redemption_id_seq RESTART WITH 1;
ALTER SEQUENCE app_order_id_seq RESTART WITH 1;
ALTER SEQUENCE assignment_id_seq RESTART WITH 1;
ALTER SEQUENCE stock_id_seq RESTART WITH 1;
ALTER SEQUENCE product_id_seq RESTART WITH 1;
ALTER SEQUENCE purchasable_item_id_seq RESTART WITH 1;
ALTER SEQUENCE category_id_seq RESTART WITH 1;
ALTER SEQUENCE points_rule_id_seq RESTART WITH 1;
ALTER SEQUENCE beneficiary_organization_id_seq RESTART WITH 1;
ALTER SEQUENCE beneficiary_id_seq RESTART WITH 1;
ALTER SEQUENCE app_user_id_seq RESTART WITH 1;
ALTER SEQUENCE collaborator_permission_id_seq RESTART WITH 1;
ALTER SEQUENCE user_permission_id_seq RESTART WITH 1;
ALTER SEQUENCE restricted_collaborator_action_id_seq RESTART WITH 1;
ALTER SEQUENCE branch_id_seq RESTART WITH 1;
ALTER SEQUENCE address_id_seq RESTART WITH 1;
ALTER SEQUENCE organization_id_seq RESTART WITH 1;
ALTER SEQUENCE status_id_seq RESTART WITH 1;
ALTER SEQUENCE app_user_organization_id_seq RESTART WITH 1;

address
app_order
app_user
app_user_organization
assignment
beneficiary
beneficiary_organization
branch
category
collaborator_permission
history
organization
points_rule
product
purchasable_item
purchase
purchase_item
redemption
restricted_collaborator_action
status
stock
user_permission
user_role