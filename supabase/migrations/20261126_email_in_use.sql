-- auth.users es uno solo para las tres apps: el cajero del onboarding con un
-- email que ya tiene cuenta (otro dueño, un cajero, un beneficiario, o un alta
-- a medio terminar) fallaba en createUser y se salteaba en silencio.
-- Solo service_role: la llama la server action, que exige sesion; asi no queda
-- expuesta por PostgREST para enumerar emails.
CREATE OR REPLACE FUNCTION public.email_in_use(p_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE lower(email) = lower(btrim(p_email))
  );
$$;

REVOKE ALL ON FUNCTION public.email_in_use(text) FROM public;
REVOKE ALL ON FUNCTION public.email_in_use(text) FROM anon;
REVOKE ALL ON FUNCTION public.email_in_use(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.email_in_use(text) TO service_role;
