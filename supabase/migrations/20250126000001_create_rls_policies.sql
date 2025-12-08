-- Migration: Create Row Level Security Policies for User Roles
-- Description: Implements RLS policies to enforce role-based access control
-- NOTE: RLS policies are commented out because the existing schema uses BIGINT for IDs
-- while Supabase Auth uses UUID. You'll need to add a user_id UUID column to link
-- app_user/beneficiary tables to auth.users before enabling RLS.
-- See docs/RLS_SETUP.md for instructions on how to set this up.

-- Enable RLS on all tables (commented out for now)
/*
ALTER TABLE user_role ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiary ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch ENABLE ROW LEVEL SECURITY;
ALTER TABLE address ENABLE ROW LEVEL SECURITY;
ALTER TABLE category ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategory ENABLE ROW LEVEL SECURITY;
ALTER TABLE product ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment ENABLE ROW LEVEL SECURITY;
ALTER TABLE status ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_order ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemption ENABLE ROW LEVEL SECURITY;
ALTER TABLE history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permission ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborator_permission ENABLE ROW LEVEL SECURITY;
ALTER TABLE restricted_collaborator_action ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role_type AS $$
DECLARE
  user_role user_role_type;
BEGIN
  -- First check if user is in app_user table
  SELECT ur.name INTO user_role
  FROM app_user au
  JOIN user_role ur ON au.role_id = ur.id
  WHERE au.id = auth.uid();
  
  IF user_role IS NOT NULL THEN
    RETURN user_role;
  END IF;
  
  -- Then check if user is a beneficiary (final_user)
  SELECT ur.name INTO user_role
  FROM beneficiary b
  JOIN user_role ur ON b.role_id = ur.id
  WHERE b.id = auth.uid();
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is owner or admin
CREATE OR REPLACE FUNCTION is_owner_or_admin()
RETURNS BOOLEAN AS $$
DECLARE
  role user_role_type;
BEGIN
  role := get_user_role();
  RETURN role IN ('owner', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user belongs to organization
CREATE OR REPLACE FUNCTION belongs_to_organization(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM app_user 
    WHERE id = auth.uid() AND organization_id = org_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- USER_ROLE TABLE POLICIES
-- ============================================================================

-- Everyone can read roles
CREATE POLICY "Anyone can view user roles"
  ON user_role FOR SELECT
  USING (true);

-- Only admins can modify roles
CREATE POLICY "Only admins can insert roles"
  ON user_role FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Only admins can update roles"
  ON user_role FOR UPDATE
  USING (is_admin());

CREATE POLICY "Only admins can delete roles"
  ON user_role FOR DELETE
  USING (is_admin());

-- ============================================================================
-- APP_USER TABLE POLICIES
-- ============================================================================

-- Users can view themselves and users in their organization
CREATE POLICY "Users can view app_users in their organization"
  ON app_user FOR SELECT
  USING (
    is_admin() OR 
    id = auth.uid() OR 
    belongs_to_organization(organization_id)
  );

-- Owners can create cashiers and collaborators in their organization
-- Admins can create any user
CREATE POLICY "Owners and admins can create users"
  ON app_user FOR INSERT
  WITH CHECK (
    is_admin() OR
    (
      is_owner_or_admin() AND
      EXISTS (
        SELECT 1 FROM app_user creator
        WHERE creator.id = auth.uid() 
        AND creator.organization_id = organization_id
      )
    )
  );

-- Users can update themselves, owners can update users in their org, admins can update anyone
CREATE POLICY "Users can update app_users appropriately"
  ON app_user FOR UPDATE
  USING (
    is_admin() OR
    id = auth.uid() OR
    (is_owner_or_admin() AND belongs_to_organization(organization_id))
  );

-- Only admins and owners can delete users in their organization
CREATE POLICY "Owners and admins can delete users"
  ON app_user FOR DELETE
  USING (
    is_admin() OR
    (is_owner_or_admin() AND belongs_to_organization(organization_id))
  );

-- ============================================================================
-- BENEFICIARY TABLE POLICIES (Final Users)
-- ============================================================================

-- Beneficiaries can view themselves
-- Cashiers, owners, collaborators, and admins can view all beneficiaries
CREATE POLICY "Users can view beneficiaries"
  ON beneficiary FOR SELECT
  USING (
    is_admin() OR
    id = auth.uid() OR
    get_user_role() IN ('cashier', 'owner', 'collaborator')
  );

-- Cashiers, owners, collaborators, and admins can create beneficiaries
CREATE POLICY "Staff can create beneficiaries"
  ON beneficiary FOR INSERT
  WITH CHECK (
    get_user_role() IN ('cashier', 'owner', 'collaborator', 'admin')
  );

-- Beneficiaries can update themselves
-- Staff can update beneficiaries
CREATE POLICY "Beneficiaries and staff can update beneficiaries"
  ON beneficiary FOR UPDATE
  USING (
    is_admin() OR
    id = auth.uid() OR
    get_user_role() IN ('cashier', 'owner', 'collaborator')
  );

-- Only admins can delete beneficiaries
CREATE POLICY "Only admins can delete beneficiaries"
  ON beneficiary FOR DELETE
  USING (is_admin());

-- ============================================================================
-- ORGANIZATION TABLE POLICIES
-- ============================================================================

-- Users can view their own organization
CREATE POLICY "Users can view their organization"
  ON organization FOR SELECT
  USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM app_user 
      WHERE app_user.id = auth.uid() 
      AND app_user.organization_id = organization.id
    )
  );

-- Only admins can create organizations
CREATE POLICY "Only admins can create organizations"
  ON organization FOR INSERT
  WITH CHECK (is_admin());

-- Owners and admins can update their organization
CREATE POLICY "Owners and admins can update organizations"
  ON organization FOR UPDATE
  USING (
    is_admin() OR
    (is_owner_or_admin() AND belongs_to_organization(id))
  );

-- Only admins can delete organizations
CREATE POLICY "Only admins can delete organizations"
  ON organization FOR DELETE
  USING (is_admin());

-- ============================================================================
-- BRANCH TABLE POLICIES
-- ============================================================================

-- Users can view branches in their organization
CREATE POLICY "Users can view branches in their organization"
  ON branch FOR SELECT
  USING (
    is_admin() OR
    belongs_to_organization(organization_id)
  );

-- Owners and admins can create branches
CREATE POLICY "Owners and admins can create branches"
  ON branch FOR INSERT
  WITH CHECK (
    is_admin() OR
    (is_owner_or_admin() AND belongs_to_organization(organization_id))
  );

-- Owners and admins can update branches
CREATE POLICY "Owners and admins can update branches"
  ON branch FOR UPDATE
  USING (
    is_admin() OR
    (is_owner_or_admin() AND belongs_to_organization(organization_id))
  );

-- Owners and admins can delete branches
CREATE POLICY "Owners and admins can delete branches"
  ON branch FOR DELETE
  USING (
    is_admin() OR
    (is_owner_or_admin() AND belongs_to_organization(organization_id))
  );

-- ============================================================================
-- CATEGORY, SUBCATEGORY, PRODUCT POLICIES
-- ============================================================================

-- Everyone can view active categories, subcategories, and products
CREATE POLICY "Anyone can view active categories"
  ON category FOR SELECT
  USING (active = true OR is_admin());

CREATE POLICY "Anyone can view active subcategories"
  ON subcategory FOR SELECT
  USING (active = true OR is_admin());

CREATE POLICY "Anyone can view active products"
  ON product FOR SELECT
  USING (active = true OR is_admin());

-- Owners, collaborators, and admins can create/update/delete
CREATE POLICY "Staff can manage categories"
  ON category FOR ALL
  USING (get_user_role() IN ('owner', 'collaborator', 'admin'))
  WITH CHECK (get_user_role() IN ('owner', 'collaborator', 'admin'));

CREATE POLICY "Staff can manage subcategories"
  ON subcategory FOR ALL
  USING (get_user_role() IN ('owner', 'collaborator', 'admin'))
  WITH CHECK (get_user_role() IN ('owner', 'collaborator', 'admin'));

CREATE POLICY "Staff can manage products"
  ON product FOR ALL
  USING (get_user_role() IN ('owner', 'collaborator', 'admin'))
  WITH CHECK (get_user_role() IN ('owner', 'collaborator', 'admin'));

-- ============================================================================
-- STOCK POLICIES
-- ============================================================================

-- Users can view stock in their organization's branches
CREATE POLICY "Users can view stock in their organization"
  ON stock FOR SELECT
  USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM branch b
      WHERE b.id = stock.branch_id
      AND belongs_to_organization(b.organization_id)
    )
  );

-- Owners, collaborators, and admins can manage stock
CREATE POLICY "Staff can manage stock"
  ON stock FOR ALL
  USING (
    is_admin() OR
    (
      get_user_role() IN ('owner', 'collaborator') AND
      EXISTS (
        SELECT 1 FROM branch b
        WHERE b.id = stock.branch_id
        AND belongs_to_organization(b.organization_id)
      )
    )
  )
  WITH CHECK (
    is_admin() OR
    (
      get_user_role() IN ('owner', 'collaborator') AND
      EXISTS (
        SELECT 1 FROM branch b
        WHERE b.id = stock.branch_id
        AND belongs_to_organization(b.organization_id)
      )
    )
  );

-- ============================================================================
-- ASSIGNMENT POLICIES (Points Assignment)
-- ============================================================================

-- Cashiers, owners, collaborators, and admins can view assignments
CREATE POLICY "Staff can view assignments"
  ON assignment FOR SELECT
  USING (
    get_user_role() IN ('cashier', 'owner', 'collaborator', 'admin')
  );

-- Cashiers, owners, collaborators, and admins can create assignments
CREATE POLICY "Staff can create assignments"
  ON assignment FOR INSERT
  WITH CHECK (
    get_user_role() IN ('cashier', 'owner', 'collaborator', 'admin')
  );

-- ============================================================================
-- ORDER AND REDEMPTION POLICIES
-- ============================================================================

-- Users can view their own orders, staff can view all
CREATE POLICY "Users can view orders"
  ON app_order FOR SELECT
  USING (
    is_admin() OR
    get_user_role() IN ('cashier', 'owner', 'collaborator')
  );

CREATE POLICY "Staff can create orders"
  ON app_order FOR INSERT
  WITH CHECK (
    get_user_role() IN ('cashier', 'owner', 'collaborator', 'admin', 'final_user')
  );

-- Redemption policies
CREATE POLICY "Users can view redemptions"
  ON redemption FOR SELECT
  USING (
    is_admin() OR
    get_user_role() IN ('cashier', 'owner', 'collaborator') OR
    beneficiary_id = auth.uid()
  );

CREATE POLICY "Staff can create redemptions"
  ON redemption FOR INSERT
  WITH CHECK (
    get_user_role() IN ('cashier', 'owner', 'collaborator', 'admin', 'final_user')
  );

-- ============================================================================
-- STATUS AND HISTORY POLICIES
-- ============================================================================

-- Everyone can view statuses
CREATE POLICY "Anyone can view statuses"
  ON status FOR SELECT
  USING (true);

-- Only admins can manage statuses
CREATE POLICY "Only admins can manage statuses"
  ON status FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Staff can view and create history
CREATE POLICY "Staff can view history"
  ON history FOR SELECT
  USING (
    get_user_role() IN ('cashier', 'owner', 'collaborator', 'admin')
  );

CREATE POLICY "Staff can create history"
  ON history FOR INSERT
  WITH CHECK (
    get_user_role() IN ('cashier', 'owner', 'collaborator', 'admin')
  );

-- ============================================================================
-- COLLABORATOR PERMISSION POLICIES
-- ============================================================================

-- Owners and admins can view collaborator permissions
CREATE POLICY "Owners and admins can view collaborator permissions"
  ON collaborator_permission FOR SELECT
  USING (is_owner_or_admin());

-- Only owners and admins can manage collaborator permissions
CREATE POLICY "Owners and admins can manage collaborator permissions"
  ON collaborator_permission FOR ALL
  USING (is_owner_or_admin())
  WITH CHECK (is_owner_or_admin());

-- Everyone can view restricted actions
CREATE POLICY "Anyone can view restricted actions"
  ON restricted_collaborator_action FOR SELECT
  USING (true);

-- Only admins can manage restricted actions
CREATE POLICY "Only admins can manage restricted actions"
  ON restricted_collaborator_action FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- ADDRESS AND USER_PERMISSION POLICIES
-- ============================================================================

-- Users can view addresses in their organization
CREATE POLICY "Users can view addresses"
  ON address FOR SELECT
  USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM branch b
      WHERE b.address_id = address.id
      AND belongs_to_organization(b.organization_id)
    )
  );

-- Owners and admins can manage addresses
CREATE POLICY "Owners and admins can manage addresses"
  ON address FOR ALL
  USING (is_owner_or_admin())
  WITH CHECK (is_owner_or_admin());

-- Users can view their own permissions
CREATE POLICY "Users can view user permissions"
  ON user_permission FOR SELECT
  USING (
    is_admin() OR
    user_id = auth.uid() OR
    (
      is_owner_or_admin() AND
      EXISTS (
        SELECT 1 FROM app_user au
        WHERE au.id = user_permission.user_id
        AND belongs_to_organization(au.organization_id)
      )
    )
  );

-- Owners and admins can manage user permissions
CREATE POLICY "Owners and admins can manage user permissions"
  ON user_permission FOR ALL
  USING (is_owner_or_admin())
  WITH CHECK (is_owner_or_admin());
*/

-- RLS policies are commented out. To enable them, you need to:
-- 1. Add a user_id UUID column to app_user and beneficiary tables
-- 2. Link these to auth.users table
-- 3. Update the helper functions to use user_id instead of id
-- 4. Uncomment the policies above
-- See docs/RLS_SETUP.md for detailed instructions
