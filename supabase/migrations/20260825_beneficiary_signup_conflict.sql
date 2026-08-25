-- beneficiary ya tiene UNIQUE(document_id) y UNIQUE(email): el duplicado nunca
-- entra. El problema es que falla adentro del trigger handle_new_user_signup,
-- y GoTrue devuelve "Database error saving new user" al beneficiario.
-- Esto avisa antes de crear nada, con el mismo criterio que las constraints.
-- Corre como anon: el sign up todavia no esta autenticado.
CREATE OR REPLACE FUNCTION public.beneficiary_signup_conflict(
  p_email text,
  p_document_id text
)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM beneficiary
      WHERE lower(btrim(email)) = lower(btrim(p_email))
    ) THEN 'email'
    WHEN p_document_id IS NOT NULL AND btrim(p_document_id) <> '' AND EXISTS (
      SELECT 1 FROM beneficiary
      WHERE btrim(document_id) = btrim(p_document_id)
    ) THEN 'document_id'
  END;
$$;

REVOKE ALL ON FUNCTION public.beneficiary_signup_conflict(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.beneficiary_signup_conflict(text, text) TO anon, authenticated;
