-- Migration: Add auth_user_id to beneficiary table
-- Description: Links beneficiary records to Supabase Auth users for proper authentication

-- Add auth_user_id column to beneficiary table
ALTER TABLE beneficiary
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create unique index to ensure one beneficiary per auth user
CREATE UNIQUE INDEX IF NOT EXISTS idx_beneficiary_auth_user_id ON beneficiary(auth_user_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_beneficiary_email ON beneficiary(email);

-- Add comment for documentation
COMMENT ON COLUMN beneficiary.auth_user_id IS 'References the Supabase Auth user ID for this beneficiary';
