-- Migration: Add Multi-Store Support for Beneficiaries
-- Description: Allows final users to belong to multiple stores/organizations
-- and track points separately for each store

-- ============================================================================
-- CREATE BENEFICIARY-ORGANIZATION RELATIONSHIP
-- ============================================================================

-- Create junction table for many-to-many relationship between beneficiaries and organizations
CREATE TABLE IF NOT EXISTS beneficiary_organization (
  id BIGSERIAL PRIMARY KEY,
  beneficiary_id BIGINT NOT NULL REFERENCES beneficiary(id) ON DELETE CASCADE,
  organization_id BIGINT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  available_points INTEGER NOT NULL DEFAULT 0 CHECK (available_points >= 0),
  total_points_earned INTEGER NOT NULL DEFAULT 0 CHECK (total_points_earned >= 0),
  total_points_redeemed INTEGER NOT NULL DEFAULT 0 CHECK (total_points_redeemed >= 0),
  joined_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(beneficiary_id, organization_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_beneficiary_org_beneficiary ON beneficiary_organization(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_beneficiary_org_organization ON beneficiary_organization(organization_id);
CREATE INDEX IF NOT EXISTS idx_beneficiary_org_active ON beneficiary_organization(is_active);

-- ============================================================================
-- UPDATE PURCHASE TABLE
-- ============================================================================

-- Add organization_id to purchase table to track which store the purchase was made at
ALTER TABLE purchase 
ADD COLUMN IF NOT EXISTS organization_id BIGINT REFERENCES organization(id);

-- Create index for organization purchases
CREATE INDEX IF NOT EXISTS idx_purchase_organization_id ON purchase(organization_id);

-- ============================================================================
-- MIGRATE EXISTING DATA
-- ============================================================================

-- Migrate existing beneficiary points to beneficiary_organization
-- This assumes each beneficiary currently has points that should be associated with all organizations
-- In a real scenario, you might want to associate them with a specific default organization
INSERT INTO beneficiary_organization (beneficiary_id, organization_id, available_points, total_points_earned, joined_date)
SELECT 
  b.id as beneficiary_id,
  o.id as organization_id,
  b.available_points,
  b.available_points as total_points_earned, -- Assuming all current points are earned
  b.registration_date as joined_date
FROM beneficiary b
CROSS JOIN organization o
WHERE NOT EXISTS (
  SELECT 1 FROM beneficiary_organization bo 
  WHERE bo.beneficiary_id = b.id AND bo.organization_id = o.id
);

-- Update existing purchases with organization_id from branch
UPDATE purchase p
SET organization_id = b.organization_id
FROM branch b
WHERE p.branch_id = b.id AND p.organization_id IS NULL;

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================

CREATE TRIGGER update_beneficiary_organization_updated_at
  BEFORE UPDATE ON beneficiary_organization
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update the trigger function to update beneficiary_organization points instead of beneficiary
CREATE OR REPLACE FUNCTION update_beneficiary_points_after_purchase()
RETURNS TRIGGER AS $$
BEGIN
  -- Add earned points to beneficiary's available points for this specific organization
  UPDATE beneficiary_organization
  SET 
    available_points = available_points + NEW.points_earned,
    total_points_earned = total_points_earned + NEW.points_earned
  WHERE beneficiary_id = NEW.beneficiary_id 
    AND organization_id = NEW.organization_id;
  
  -- If the relationship doesn't exist, create it
  IF NOT FOUND THEN
    INSERT INTO beneficiary_organization (beneficiary_id, organization_id, available_points, total_points_earned)
    VALUES (NEW.beneficiary_id, NEW.organization_id, NEW.points_earned, NEW.points_earned);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CREATE HELPER VIEWS
-- ============================================================================

-- View to see all stores a beneficiary belongs to with their points
CREATE OR REPLACE VIEW beneficiary_stores AS
SELECT 
  bo.id,
  bo.beneficiary_id,
  b.first_name,
  b.last_name,
  b.email,
  bo.organization_id,
  o.name as organization_name,
  bo.available_points,
  bo.total_points_earned,
  bo.total_points_redeemed,
  bo.joined_date,
  bo.is_active
FROM beneficiary_organization bo
JOIN beneficiary b ON bo.beneficiary_id = b.id
JOIN organization o ON bo.organization_id = o.id
WHERE bo.is_active = true;

-- View to get total points across all stores for a beneficiary
CREATE OR REPLACE VIEW beneficiary_total_points AS
SELECT 
  beneficiary_id,
  SUM(available_points) as total_available_points,
  SUM(total_points_earned) as total_points_earned,
  SUM(total_points_redeemed) as total_points_redeemed,
  COUNT(organization_id) as store_count
FROM beneficiary_organization
WHERE is_active = true
GROUP BY beneficiary_id;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE beneficiary_organization IS 'Many-to-many relationship between beneficiaries and organizations, tracking points per store';
COMMENT ON COLUMN beneficiary_organization.available_points IS 'Points available to spend at this specific organization';
COMMENT ON COLUMN beneficiary_organization.total_points_earned IS 'Total points ever earned at this organization';
COMMENT ON COLUMN beneficiary_organization.total_points_redeemed IS 'Total points redeemed at this organization';
COMMENT ON COLUMN beneficiary_organization.joined_date IS 'When the beneficiary joined this organization';
COMMENT ON COLUMN beneficiary_organization.is_active IS 'Whether the beneficiary is still active in this organization';
