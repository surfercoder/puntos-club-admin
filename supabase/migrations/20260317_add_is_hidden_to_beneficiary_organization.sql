-- Add is_hidden column to beneficiary_organization table
-- When true, the organization is hidden from this beneficiary (they can't see or join the org)
ALTER TABLE beneficiary_organization
ADD COLUMN is_hidden BOOLEAN NOT NULL DEFAULT FALSE;

-- Add index for efficient filtering
CREATE INDEX idx_beneficiary_organization_is_hidden
ON beneficiary_organization (beneficiary_id, organization_id)
WHERE is_hidden = TRUE;
