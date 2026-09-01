-- =====================================================================
-- El beneficiario puede leer la direccion de las sucursales que sigue
-- =====================================================================
-- `branch` ya se lee desde la app (beneficiary_read_branches), pero la
-- direccion vive en `address`, cuya unica policy de SELECT para el
-- beneficiario es "mi propia direccion". El join branch -> address volvia
-- siempre en null: sin error, sin datos.
--
-- Se refleja la policy de branch: direcciones de sucursales de una
-- organizacion que el beneficiario sigue activo.
-- =====================================================================

CREATE POLICY beneficiary_read_branch_addresses ON public.address
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.branch br
    JOIN public.beneficiary_organization bo
      ON bo.organization_id = br.organization_id
    JOIN public.beneficiary b
      ON b.id = bo.beneficiary_id
    WHERE br.address_id = address.id
      AND b.auth_user_id = auth.uid()
      AND bo.is_active
  ));
