-- Dos empresas con el mismo nombre confunden al beneficiario al elegir club
-- y al owner al buscar la suya. El nombre es la identidad visible del club:
-- una sola por nombre, comparado sin distinguir mayusculas ni espacios.
CREATE UNIQUE INDEX IF NOT EXISTS organization_name_unique
  ON organization (lower(btrim(name)));

-- El onboarding avisa "nombre disponible / ya usado" antes de crear nada.
-- La normalizacion vive aca para que sea la misma que la del indice: si el
-- chequeo dice disponible, el INSERT no puede fallar por duplicado.
CREATE OR REPLACE FUNCTION public.org_name_taken(p_name text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization
    WHERE lower(btrim(name)) = lower(btrim(p_name))
  );
$$;

REVOKE ALL ON FUNCTION public.org_name_taken(text) FROM public;
REVOKE ALL ON FUNCTION public.org_name_taken(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.org_name_taken(text) TO authenticated;
