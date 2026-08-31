-- =====================================================================
-- beneficiary_organization.is_active deja de ser nullable
-- =====================================================================
-- La columna era `boolean NULL DEFAULT true` y cada lado leía el NULL a su
-- manera: el admin lo mostraba como activo (`?? true`) y las RPC de canje
-- lo tratan como inactivo (`IS DISTINCT FROM true`). Hoy no hay ninguna
-- fila en NULL, así que se cierra la ambigüedad antes de que aparezca.
-- =====================================================================

UPDATE public.beneficiary_organization SET is_active = true WHERE is_active IS NULL;

ALTER TABLE public.beneficiary_organization
  ALTER COLUMN is_active SET DEFAULT true,
  ALTER COLUMN is_active SET NOT NULL;
