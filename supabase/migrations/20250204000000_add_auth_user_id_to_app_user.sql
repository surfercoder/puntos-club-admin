-- Migration: Add auth_user_id to app_user table
-- Description: Links app_user records to Supabase Auth users for proper authentication
-- This enables owners, collaborators, cashiers, and admins to log in with their credentials

-- Add auth_user_id column to app_user table
ALTER TABLE app_user
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create unique index to ensure one app_user per auth user
CREATE UNIQUE INDEX IF NOT EXISTS idx_app_user_auth_user_id ON app_user(auth_user_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_app_user_email ON app_user(email);

-- Add comment for documentation
COMMENT ON COLUMN app_user.auth_user_id IS 'References the Supabase Auth user ID for this app user';
