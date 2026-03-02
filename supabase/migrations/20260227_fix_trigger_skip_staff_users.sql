-- ============================================================================
-- Fix: prevent the new-user trigger from inserting staff users (cashier, owner,
-- admin, etc.) into the beneficiary table.
--
-- The trigger fires on every auth.users insert. We now skip the beneficiary
-- insert when the user carries a role_name in their metadata that identifies
-- them as a back-office / staff user.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role_name text;
BEGIN
  -- Read the optional role hint stored in user_metadata by the admin client.
  v_role_name := NEW.raw_user_meta_data ->> 'role_name';

  -- Skip beneficiary creation for staff / back-office accounts.
  IF v_role_name IN ('owner', 'cashier', 'admin', 'manager') THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.beneficiary (email, first_name, last_name)
  VALUES (
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );

  RETURN NEW;
END;
$$;
