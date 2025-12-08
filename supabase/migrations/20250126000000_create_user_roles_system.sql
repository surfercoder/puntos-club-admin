-- Migration: Create User Roles System
-- Description: Implements a comprehensive role-based access control system for 5 user types:
-- 1. final_user: Users of PuntosClub mobile app
-- 2. cashier: Users of PuntosClubCaja mobile app
-- 3. owner: Store owners using puntos-club-admin portal
-- 4. collaborator: Helper users added by owners using puntos-club-admin portal
-- 5. admin: System administrators (Charly, Fede, Agustin)

-- Create enum for user roles
CREATE TYPE user_role_type AS ENUM (
  'final_user',
  'cashier',
  'owner',
  'collaborator',
  'admin'
);

-- Create user_role table to store role definitions
CREATE TABLE IF NOT EXISTS user_role (
  id BIGSERIAL PRIMARY KEY,
  name user_role_type NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add role_id to app_user table (for cashier, owner, collaborator, admin)
ALTER TABLE app_user 
ADD COLUMN IF NOT EXISTS role_id BIGINT REFERENCES user_role(id),
ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES app_user(id),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add role_id to beneficiary table (for final_user)
-- Beneficiaries are the final users of the mobile app
ALTER TABLE beneficiary
ADD COLUMN IF NOT EXISTS role_id BIGINT REFERENCES user_role(id),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW() CHECK (created_at IS NOT NULL),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update beneficiary table to ensure registration_date has default
ALTER TABLE beneficiary 
ALTER COLUMN registration_date SET DEFAULT NOW();

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_app_user_role_id ON app_user(role_id);
CREATE INDEX IF NOT EXISTS idx_beneficiary_role_id ON beneficiary(role_id);
CREATE INDEX IF NOT EXISTS idx_app_user_organization_id ON app_user(organization_id);
CREATE INDEX IF NOT EXISTS idx_app_user_created_by ON app_user(created_by);

-- Insert default roles
INSERT INTO user_role (name, display_name, description) VALUES
  ('final_user', 'Final User', 'Users of PuntosClub mobile app who make purchases and redeem points'),
  ('cashier', 'Cashier/Clerk', 'Store employees using PuntosClubCaja app to process purchases and redemptions'),
  ('owner', 'Store Owner', 'Store owners with full admin access to their stores via puntos-club-admin portal'),
  ('collaborator', 'Collaborator', 'Helper users added by owners with limited admin permissions via puntos-club-admin portal'),
  ('admin', 'System Administrator', 'System administrators with full access to all apps and entities')
ON CONFLICT (name) DO NOTHING;

-- Create a table to track collaborator permissions
-- This defines what actions collaborators can perform
CREATE TABLE IF NOT EXISTS collaborator_permission (
  id BIGSERIAL PRIMARY KEY,
  collaborator_id BIGINT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  permission_type VARCHAR(100) NOT NULL,
  can_execute BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collaborator_id, permission_type)
);

-- Create index for collaborator permissions
CREATE INDEX IF NOT EXISTS idx_collaborator_permission_user ON collaborator_permission(collaborator_id);

-- Insert default collaborator permissions (what they CANNOT do)
-- Collaborators have most owner permissions except these restricted ones
CREATE TABLE IF NOT EXISTS restricted_collaborator_action (
  id BIGSERIAL PRIMARY KEY,
  action_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO restricted_collaborator_action (action_name, description) VALUES
  ('create_collaborator', 'Cannot create or invite new collaborators'),
  ('delete_collaborator', 'Cannot remove other collaborators'),
  ('modify_owner_settings', 'Cannot modify owner-level settings'),
  ('delete_organization', 'Cannot delete the organization'),
  ('transfer_ownership', 'Cannot transfer store ownership')
ON CONFLICT (action_name) DO NOTHING;

-- Create function to automatically set updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_user_role_updated_at
  BEFORE UPDATE ON user_role
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_user_updated_at
  BEFORE UPDATE ON app_user
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beneficiary_updated_at
  BEFORE UPDATE ON beneficiary
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collaborator_permission_updated_at
  BEFORE UPDATE ON collaborator_permission
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create a view for easy role checking
CREATE OR REPLACE VIEW user_with_role AS
SELECT 
  au.id,
  au.organization_id,
  au.first_name,
  au.last_name,
  au.email,
  au.username,
  au.active,
  au.created_by,
  au.created_at,
  au.updated_at,
  ur.name as role_name,
  ur.display_name as role_display_name,
  'app_user' as user_type
FROM app_user au
LEFT JOIN user_role ur ON au.role_id = ur.id

UNION ALL

SELECT 
  b.id,
  NULL as organization_id,
  b.first_name,
  b.last_name,
  b.email,
  NULL as username,
  true as active,
  NULL as created_by,
  b.created_at,
  b.updated_at,
  ur.name as role_name,
  ur.display_name as role_display_name,
  'beneficiary' as user_type
FROM beneficiary b
LEFT JOIN user_role ur ON b.role_id = ur.id;

-- Add comments for documentation
COMMENT ON TYPE user_role_type IS 'Enum defining the 5 types of users in the system';
COMMENT ON TABLE user_role IS 'Stores role definitions for the system';
COMMENT ON TABLE collaborator_permission IS 'Tracks specific permissions for collaborator users';
COMMENT ON TABLE restricted_collaborator_action IS 'Defines actions that collaborators cannot perform';
COMMENT ON COLUMN app_user.role_id IS 'References the role of this user (cashier, owner, collaborator, or admin)';
COMMENT ON COLUMN app_user.created_by IS 'References the user who created this account (for collaborators created by owners)';
COMMENT ON COLUMN beneficiary.role_id IS 'References the role of this user (should always be final_user)';
