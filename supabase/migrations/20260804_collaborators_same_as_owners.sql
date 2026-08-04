-- ============================================================================
-- Collaborators get the same permissions as owners.
--
-- Collaborators are employees / right-hands that owners create and designate
-- themselves, so for this version they are treated exactly like owners.
-- ============================================================================

-- 1. push_notifications: owner-only write policies now include collaborators.
DROP POLICY IF EXISTS "Owners can create notifications" ON public.push_notifications;
CREATE POLICY "Owners can create notifications"
  ON public.push_notifications FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT au.organization_id
      FROM public.app_user au
      JOIN public.user_role ur ON au.role_id = ur.id
      WHERE au.auth_user_id = auth.uid()
        AND ur.name = ANY (ARRAY['owner'::user_role_type,
                                 'collaborator'::user_role_type,
                                 'admin'::user_role_type])
    )
  );

DROP POLICY IF EXISTS "Owners can update notifications" ON public.push_notifications;
CREATE POLICY "Owners can update notifications"
  ON public.push_notifications FOR UPDATE
  USING (
    organization_id IN (
      SELECT au.organization_id
      FROM public.app_user au
      JOIN public.user_role ur ON au.role_id = ur.id
      WHERE au.auth_user_id = auth.uid()
        AND ur.name = ANY (ARRAY['owner'::user_role_type,
                                 'collaborator'::user_role_type,
                                 'admin'::user_role_type])
    )
  );

-- 2. handle_new_user: 'collaborator' is staff too — do not create a beneficiary
--    row for it (owners creating collaborators were getting phantom members).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role_name text;
BEGIN
  v_role_name := NEW.raw_user_meta_data ->> 'role_name';

  IF v_role_name IN ('owner', 'collaborator', 'cashier', 'admin', 'manager') THEN
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
