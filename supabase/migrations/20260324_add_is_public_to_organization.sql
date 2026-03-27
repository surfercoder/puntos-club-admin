-- Add is_public column to organization table
-- When false, the organization is not shown in the PuntosClub mobile app explore screen
-- but can still be joined via QR code.
ALTER TABLE public.organization
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.organization.is_public IS
  'When false, the organization is not shown in the PuntosClub mobile app explore screen but can still be joined via QR code.';
