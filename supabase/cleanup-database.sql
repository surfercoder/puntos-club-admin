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
DELETE FROM subcategory;
DELETE FROM category;

-- 7. Delete points rules
DELETE FROM points_rule;

-- 8. Delete beneficiary-organization relationships
DELETE FROM beneficiary_organization;

-- 9. Delete user data
DELETE FROM beneficiary;
DELETE FROM app_user;

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

-- 14. Keep user_role table (these are system roles, not user data)
-- DELETE FROM user_role; -- COMMENTED OUT - Keep roles for system

-- Re-enable triggers
SET session_replication_role = 'origin';

-- ============================================================================
-- RESET SEQUENCES (Optional - resets auto-increment IDs to 1)
-- ============================================================================
-- Uncomment the following lines if you want to reset ID sequences

-- ALTER SEQUENCE purchase_item_id_seq RESTART WITH 1;
-- ALTER SEQUENCE purchase_id_seq RESTART WITH 1;
-- ALTER SEQUENCE history_id_seq RESTART WITH 1;
-- ALTER SEQUENCE redemption_id_seq RESTART WITH 1;
-- ALTER SEQUENCE app_order_id_seq RESTART WITH 1;
-- ALTER SEQUENCE assignment_id_seq RESTART WITH 1;
-- ALTER SEQUENCE stock_id_seq RESTART WITH 1;
-- ALTER SEQUENCE product_id_seq RESTART WITH 1;
-- ALTER SEQUENCE purchasable_item_id_seq RESTART WITH 1;
-- ALTER SEQUENCE subcategory_id_seq RESTART WITH 1;
-- ALTER SEQUENCE category_id_seq RESTART WITH 1;
-- ALTER SEQUENCE points_rule_id_seq RESTART WITH 1;
-- ALTER SEQUENCE beneficiary_organization_id_seq RESTART WITH 1;
-- ALTER SEQUENCE beneficiary_id_seq RESTART WITH 1;
-- ALTER SEQUENCE app_user_id_seq RESTART WITH 1;
-- ALTER SEQUENCE collaborator_permission_id_seq RESTART WITH 1;
-- ALTER SEQUENCE user_permission_id_seq RESTART WITH 1;
-- ALTER SEQUENCE restricted_collaborator_action_id_seq RESTART WITH 1;
-- ALTER SEQUENCE branch_id_seq RESTART WITH 1;
-- ALTER SEQUENCE address_id_seq RESTART WITH 1;
-- ALTER SEQUENCE organization_id_seq RESTART WITH 1;
-- ALTER SEQUENCE status_id_seq RESTART WITH 1;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the cleanup was successful

/*
-- Check table counts (should all be 0 except user_role which should have 5)
SELECT 'purchase_item' as table_name, COUNT(*) as count FROM purchase_item
UNION ALL SELECT 'purchase', COUNT(*) FROM purchase
UNION ALL SELECT 'history', COUNT(*) FROM history
UNION ALL SELECT 'redemption', COUNT(*) FROM redemption
UNION ALL SELECT 'app_order', COUNT(*) FROM app_order
UNION ALL SELECT 'assignment', COUNT(*) FROM assignment
UNION ALL SELECT 'stock', COUNT(*) FROM stock
UNION ALL SELECT 'product', COUNT(*) FROM product
UNION ALL SELECT 'purchasable_item', COUNT(*) FROM purchasable_item
UNION ALL SELECT 'subcategory', COUNT(*) FROM subcategory
UNION ALL SELECT 'category', COUNT(*) FROM category
UNION ALL SELECT 'points_rule', COUNT(*) FROM points_rule
UNION ALL SELECT 'beneficiary_organization', COUNT(*) FROM beneficiary_organization
UNION ALL SELECT 'beneficiary', COUNT(*) FROM beneficiary
UNION ALL SELECT 'app_user', COUNT(*) FROM app_user
UNION ALL SELECT 'collaborator_permission', COUNT(*) FROM collaborator_permission
UNION ALL SELECT 'user_permission', COUNT(*) FROM user_permission
UNION ALL SELECT 'restricted_collaborator_action', COUNT(*) FROM restricted_collaborator_action
UNION ALL SELECT 'branch', COUNT(*) FROM branch
UNION ALL SELECT 'address', COUNT(*) FROM address
UNION ALL SELECT 'organization', COUNT(*) FROM organization
UNION ALL SELECT 'status', COUNT(*) FROM status
UNION ALL SELECT 'user_role', COUNT(*) FROM user_role
ORDER BY table_name;
*/

-- ============================================================================
-- NOTES FOR STARTING FRESH
-- ============================================================================

/*
After running this cleanup script, you should:

1. CREATE YOUR ADMIN USER:
   - Go to Supabase Dashboard > Authentication > Users
   - Click "Add User" or "Invite User"
   - Use your email (e.g., admin@puntosclub.com)
   - Set a secure password
   - After creating the auth user, add them to app_user table:

   INSERT INTO app_user (
     first_name,
     last_name,
     email,
     username,
     role_id
   ) VALUES (
     'Your First Name',
     'Your Last Name',
     'admin@puntosclub.com',
     'admin',
     (SELECT id FROM user_role WHERE name = 'admin')
   );

2. CREATE ORGANIZATIONS:
   - Use the admin portal to create your stores/organizations
   - Or insert directly:
   
   INSERT INTO organization (name, business_name, tax_id)
   VALUES ('My Store', 'My Store LLC', '12-3456789');

3. CREATE BRANCHES:
   - Add physical locations for each organization
   - Include addresses for each branch

4. CREATE OWNERS:
   - Create auth users for store owners
   - Link them to their organizations via app_user table
   - Set role_id to the 'owner' role

5. CREATE CASHIERS:
   - Create auth users for cashiers
   - Link them to branches via app_user table
   - Set role_id to the 'cashier' role

6. CREATE FINAL USERS (Beneficiaries):
   - These can be created via the mobile app signup
   - Or manually via the admin portal

7. CREATE POINTS RULES:
   - Define how points are calculated
   - Set up special offers and promotions
   - Example:
   
   INSERT INTO points_rule (
     name,
     description,
     rule_type,
     config,
     is_active,
     priority
   ) VALUES (
     'Standard Points',
     'Earn 2 points per dollar spent',
     'fixed_amount',
     '{"points_per_dollar": 2}',
     true,
     0
   );

8. CREATE PRODUCT CATALOG:
   - Add categories and subcategories
   - Add products for redemption
   - Set up stock levels

IMPORTANT: Make sure to create users in this order:
1. Admin (you)
2. Organizations
3. Owners (linked to organizations)
4. Branches
5. Cashiers (linked to branches)
6. Final Users/Beneficiaries
7. Points Rules
8. Products and Stock

This ensures all foreign key relationships are properly maintained.
*/
