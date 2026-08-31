-- =====================================================================
-- Una venta no puede acreditar puntos a una membresía dada de baja
-- =====================================================================
-- El canje ya validaba `beneficiary_organization.is_active` dentro de
-- request_redemption, pero la venta no validaba nada: los cuatro caminos
-- que insertan en `purchase` (API del admin, server action, form del
-- dashboard y la app de caja, que inserta directo) llegaban a
-- update_beneficiary_points_after_purchase, que suma los puntos sin mirar
-- el estado — y si la membresía no existe, la crea.
--
-- El guard va en la tabla y no en cada caller: es el único punto por el
-- que pasan los cuatro.
--
-- Se mantiene el alta implícita (beneficiario sin membresía en esa org):
-- ese camino lo sigue creando el trigger de puntos. Acá sólo se frena a
-- quien tiene membresía y está dado de baja.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.check_purchase_membership()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_org_id    bigint;
  v_is_active boolean;
BEGIN
  -- En UPDATE sólo revalidamos si cambia algo que mueva puntos; editar las
  -- notas de una venta vieja no debe romperse porque el socio se dio de baja.
  IF TG_OP = 'UPDATE'
     AND NEW.beneficiary_id = OLD.beneficiary_id
     AND NEW.organization_id IS NOT DISTINCT FROM OLD.organization_id
     AND NEW.points_earned = OLD.points_earned THEN
    RETURN NEW;
  END IF;

  -- purchase.organization_id es nullable y la API del admin no lo setea;
  -- sin resolverlo el trigger de puntos tampoco encuentra la membresía.
  v_org_id := COALESCE(
    NEW.organization_id,
    (SELECT b.organization_id FROM public.branch b WHERE b.id = NEW.branch_id)
  );

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'PURCHASE_ORG_UNKNOWN' USING ERRCODE = 'P0002';
  END IF;

  NEW.organization_id := v_org_id;

  SELECT bo.is_active INTO v_is_active
  FROM public.beneficiary_organization bo
  WHERE bo.beneficiary_id = NEW.beneficiary_id
    AND bo.organization_id = v_org_id;

  IF FOUND AND v_is_active IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'MEMBERSHIP_INACTIVE' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_purchase_membership_trigger ON public.purchase;
CREATE TRIGGER check_purchase_membership_trigger
  BEFORE INSERT OR UPDATE ON public.purchase
  FOR EACH ROW EXECUTE FUNCTION public.check_purchase_membership();
