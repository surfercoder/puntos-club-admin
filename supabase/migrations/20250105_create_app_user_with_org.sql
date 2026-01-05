-- Create a stored procedure to atomically create app_user and app_user_organization
-- This ensures both records are created in a single transaction, preventing orphaned state

CREATE OR REPLACE FUNCTION create_app_user_with_org(
  p_email TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_username TEXT,
  p_organization_id BIGINT,
  p_role_id BIGINT,
  p_auth_user_id UUID,
  p_password TEXT DEFAULT NULL,
  p_active BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
  id BIGINT,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  username TEXT,
  organization_id BIGINT,
  role_id BIGINT,
  auth_user_id UUID,
  active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_app_user_id BIGINT;
  v_app_user RECORD;
BEGIN
  -- Insert into app_user table
  INSERT INTO app_user (
    email,
    first_name,
    last_name,
    username,
    organization_id,
    role_id,
    auth_user_id,
    password,
    active,
    created_by
  ) VALUES (
    p_email,
    p_first_name,
    p_last_name,
    p_username,
    p_organization_id,
    p_role_id,
    p_auth_user_id,
    p_password,
    p_active,
    NULL
  )
  RETURNING * INTO v_app_user;

  v_app_user_id := v_app_user.id;

  -- Insert into app_user_organization table
  INSERT INTO app_user_organization (
    app_user_id,
    organization_id,
    is_active
  ) VALUES (
    v_app_user_id,
    p_organization_id,
    TRUE
  );

  -- Return the created app_user record
  RETURN QUERY
  SELECT
    v_app_user.id,
    v_app_user.email,
    v_app_user.first_name,
    v_app_user.last_name,
    v_app_user.username,
    v_app_user.organization_id,
    v_app_user.role_id,
    v_app_user.auth_user_id,
    v_app_user.active,
    v_app_user.created_at,
    v_app_user.updated_at;

EXCEPTION
  WHEN OTHERS THEN
    -- Re-raise the exception to rollback the transaction
    RAISE;
END;
$$;
