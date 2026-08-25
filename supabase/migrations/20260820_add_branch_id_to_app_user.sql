-- Cada cajero opera en una sucursal: la pantalla de Sucursales muestra el cajero
-- asignado y la App Cajeros necesita saber dónde puede registrar operaciones.
-- Nullable a propósito: owners, colaboradores y admins no tienen sucursal.

ALTER TABLE public.app_user
  ADD COLUMN IF NOT EXISTS branch_id bigint REFERENCES public.branch(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.app_user.branch_id IS
  'Sucursal en la que opera el cajero. NULL para owners, colaboradores y admins.';

CREATE INDEX IF NOT EXISTS app_user_branch_id_idx ON public.app_user (branch_id);
