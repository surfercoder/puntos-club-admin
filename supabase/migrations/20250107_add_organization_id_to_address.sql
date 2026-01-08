-- Add organization_id column to address table
-- This ensures addresses are scoped to organizations, preventing cross-organization data leakage

-- Add the organization_id column (nullable initially to handle existing data)
ALTER TABLE address
ADD COLUMN organization_id BIGINT;

-- Add foreign key constraint to organization table
ALTER TABLE address
ADD CONSTRAINT fk_address_organization
FOREIGN KEY (organization_id)
REFERENCES organization(id)
ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_address_organization_id ON address(organization_id);

-- Note: Existing addresses will have NULL organization_id
-- You may need to manually update existing addresses to assign them to the correct organization
-- or delete them if they are test data
