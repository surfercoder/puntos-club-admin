-- Change redemption_date column from date to timestamptz to store full timestamp
ALTER TABLE redemption 
ALTER COLUMN redemption_date TYPE timestamptz 
USING redemption_date::timestamptz;

-- Set default to current timestamp for new records
ALTER TABLE redemption 
ALTER COLUMN redemption_date SET DEFAULT now();

-- Add comment to document the change
COMMENT ON COLUMN redemption.redemption_date IS 'Timestamp when the redemption was made (with timezone)';
