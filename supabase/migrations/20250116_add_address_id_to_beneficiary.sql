-- Add address_id column to beneficiary table
ALTER TABLE beneficiary
ADD COLUMN address_id BIGINT REFERENCES address(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_beneficiary_address_id ON beneficiary(address_id);

-- Add comment
COMMENT ON COLUMN beneficiary.address_id IS 'Optional reference to the beneficiary address';
