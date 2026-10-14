-- =====================================================================
-- Planes: ajuste a la grilla del Excel + tope de beneficiarios en la base
-- =====================================================================
-- 1. El Excel pide 3 premios por catálogo en Trial; la siembra del 18/09
--    dejó 2. Se corrige el plan y los snapshots de las orgs en Trial que
--    seguían con el valor sembrado (un override a mano no se toca).
--
-- 2. El tope de beneficiarios sólo lo frenaba el admin. Una persona que se
--    une desde la app, la Caja invitando a alguien o la primera compra de
--    un socio nuevo (private.apply_purchase_points) entraban igual. El
--    guard va en un trigger porque es el único punto por el que pasan los
--    cinco caminos, y corta con PLAN_LIMIT_REACHED como el resto de los
--    RPC (las apps lo traducen por token, no por texto).
--
--    Cuenta un alta nueva o una reactivación (is_active false -> true).
--    Bajar de plan no expulsa a nadie: sólo impide sumar.
-- =====================================================================

UPDATE public.plan_limits
SET limit_value = 3
WHERE plan = 'trial' AND feature = 'redeemable_products' AND limit_value = 2;

UPDATE public.organization_plan_limits opl
SET limit_value = 3
FROM public.organization o
WHERE o.id = opl.organization_id
  AND o.plan = 'trial'
  AND opl.feature = 'redeemable_products'
  AND opl.limit_value = 2;

CREATE OR REPLACE FUNCTION private.enforce_beneficiaries_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
BEGIN
  IF NOT COALESCE(NEW.is_active, true) THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND COALESCE(OLD.is_active, false) THEN
    RETURN NEW;
  END IF;

  -- Dos altas simultáneas al mismo club no pueden leer el mismo conteo y
  -- pasar las dos el último lugar.
  PERFORM pg_advisory_xact_lock(hashtext('beneficiaries_limit'), NEW.organization_id::int);

  IF NOT (public.check_plan_limit(NEW.organization_id, 'beneficiaries') ->> 'allowed')::boolean THEN
    RAISE EXCEPTION 'PLAN_LIMIT_REACHED' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_beneficiaries_limit ON public.beneficiary_organization;
CREATE TRIGGER trg_enforce_beneficiaries_limit
  BEFORE INSERT OR UPDATE OF is_active ON public.beneficiary_organization
  FOR EACH ROW EXECUTE FUNCTION private.enforce_beneficiaries_limit();
