-- Add RLS policies for beneficiaries to create and manage their own addresses

-- Enable RLS on address table if not already enabled
ALTER TABLE address ENABLE ROW LEVEL SECURITY;

-- Policy: Beneficiaries can insert their own addresses
CREATE POLICY "Beneficiaries can create addresses"
ON address
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if the user is a beneficiary (has a record in beneficiary table with matching auth_user_id)
  EXISTS (
    SELECT 1 FROM beneficiary
    WHERE beneficiary.auth_user_id = auth.uid()
  )
);

-- Policy: Beneficiaries can view their own addresses
CREATE POLICY "Beneficiaries can view their own addresses"
ON address
FOR SELECT
TO authenticated
USING (
  -- Allow if the address is linked to the beneficiary
  id IN (
    SELECT address_id FROM beneficiary
    WHERE beneficiary.auth_user_id = auth.uid()
    AND address_id IS NOT NULL
  )
);

-- Policy: Beneficiaries can update their own addresses
CREATE POLICY "Beneficiaries can update their own addresses"
ON address
FOR UPDATE
TO authenticated
USING (
  -- Allow if the address is linked to the beneficiary
  id IN (
    SELECT address_id FROM beneficiary
    WHERE beneficiary.auth_user_id = auth.uid()
    AND address_id IS NOT NULL
  )
)
WITH CHECK (
  -- Ensure they can only update their own address
  id IN (
    SELECT address_id FROM beneficiary
    WHERE beneficiary.auth_user_id = auth.uid()
    AND address_id IS NOT NULL
  )
);

-- Policy: Allow app_users (admin/collaborators) to manage all addresses
CREATE POLICY "App users can manage all addresses"
ON address
FOR ALL
TO authenticated
USING (
  -- Allow if user is an app_user (admin or collaborator)
  EXISTS (
    SELECT 1 FROM app_user
    WHERE app_user.auth_user_id = auth.uid()
    AND app_user.active = true
  )
)
WITH CHECK (
  -- Same check for INSERT/UPDATE
  EXISTS (
    SELECT 1 FROM app_user
    WHERE app_user.auth_user_id = auth.uid()
    AND app_user.active = true
  )
);

-- Add comment
COMMENT ON POLICY "Beneficiaries can create addresses" ON address IS 'Allows authenticated beneficiaries to create address records';
COMMENT ON POLICY "Beneficiaries can view their own addresses" ON address IS 'Allows beneficiaries to view their linked addresses';
COMMENT ON POLICY "Beneficiaries can update their own addresses" ON address IS 'Allows beneficiaries to update their linked addresses';
COMMENT ON POLICY "App users can manage all addresses" ON address IS 'Allows admin users and collaborators to manage all addresses';
