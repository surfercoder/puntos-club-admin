-- Temporarily disable RLS on tables for development
-- This allows all authenticated users to read/write data
-- TODO: Re-enable RLS with proper policies before production

ALTER TABLE app_user DISABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiary DISABLE ROW LEVEL SECURITY;
ALTER TABLE organization DISABLE ROW LEVEL SECURITY;
ALTER TABLE branch DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_role DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view app_users in their organization" ON app_user;
DROP POLICY IF EXISTS "Owners and admins can create users" ON app_user;
DROP POLICY IF EXISTS "Users can update app_users appropriately" ON app_user;
DROP POLICY IF EXISTS "Owners and admins can delete users" ON app_user;

DROP POLICY IF EXISTS "Users can view beneficiaries" ON beneficiary;
DROP POLICY IF EXISTS "Staff can create beneficiaries" ON beneficiary;
DROP POLICY IF EXISTS "Beneficiaries and staff can update beneficiaries" ON beneficiary;
DROP POLICY IF EXISTS "Only admins can delete beneficiaries" ON beneficiary;

DROP POLICY IF EXISTS "Users can view their organization" ON organization;
DROP POLICY IF EXISTS "Only admins can create organizations" ON organization;
DROP POLICY IF EXISTS "Owners and admins can update organizations" ON organization;
DROP POLICY IF EXISTS "Only admins can delete organizations" ON organization;

DROP POLICY IF EXISTS "Anyone can view user roles" ON user_role;
DROP POLICY IF EXISTS "Only admins can insert roles" ON user_role;
DROP POLICY IF EXISTS "Only admins can update roles" ON user_role;
DROP POLICY IF EXISTS "Only admins can delete roles" ON user_role;

COMMENT ON TABLE app_user IS 'RLS disabled for development - re-enable before production';
COMMENT ON TABLE beneficiary IS 'RLS disabled for development - re-enable before production';
