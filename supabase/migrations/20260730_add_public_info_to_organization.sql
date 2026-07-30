-- Add public_info column to organization table
-- Free-text block the owner writes to show beneficiaries in the mobile app's
-- "Sobre la organización" card (branches, phone, contact email, instagram...).
-- Replaces exposing legal data (business_name / tax_id) to beneficiaries.
ALTER TABLE public.organization
  ADD COLUMN IF NOT EXISTS public_info text;

COMMENT ON COLUMN public.organization.public_info IS
  'Owner-authored free text shown to beneficiaries in the mobile app''s "Sobre la organización" card.';
