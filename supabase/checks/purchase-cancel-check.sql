-- Self-check de la cancelacion de compras (migracion 20260831_purchase_soft_cancel).
-- Cancelar una compra devuelve los puntos, la fila NO se borra, y reactivarla
-- los vuelve a sumar. Se revierte solo: seguro en cualquier entorno con al
-- menos una compra con puntos.
--
--   psql "$DATABASE_URL" -f supabase/checks/purchase-cancel-check.sql
--
-- Pasa = termina con `ERROR: ROLLBACK_SELF_CHECK`. Cualquier otro error es fallo.
DO $$
DECLARE
  p        public.purchase%ROWTYPE;
  pts0     int; pts1 int; pts2 int;
  n_rows   int;
BEGIN
  SELECT pu.* INTO p
  FROM public.purchase pu
  JOIN public.beneficiary_organization bo
    ON bo.beneficiary_id = pu.beneficiary_id
   AND bo.organization_id = pu.organization_id
  WHERE pu.points_earned > 0 AND pu.status = 'active'
  ORDER BY pu.id LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'SKIPPED: no hay ninguna compra activa con puntos y membresia para probar';
  END IF;

  SELECT available_points INTO pts0 FROM public.beneficiary_organization
   WHERE beneficiary_id = p.beneficiary_id AND organization_id = p.organization_id;
  -- Sin esto un pts0 NULL vuelve NULL cada comparacion y el check pasa en vacio.
  IF pts0 IS NULL THEN
    RAISE EXCEPTION 'la compra elegida no tiene membresia: el check no probaria nada';
  END IF;

  UPDATE public.purchase
     SET status = 'cancelled', cancelled_at = now(), cancellation_reason = 'self-check'
   WHERE id = p.id;

  SELECT available_points INTO pts1 FROM public.beneficiary_organization
   WHERE beneficiary_id = p.beneficiary_id AND organization_id = p.organization_id;
  IF pts1 <> pts0 - p.points_earned THEN
    RAISE EXCEPTION 'cancelar no devolvio los puntos: % -> % (esperado %)',
      pts0, pts1, pts0 - p.points_earned;
  END IF;

  SELECT count(*) INTO n_rows FROM public.purchase WHERE id = p.id;
  IF n_rows <> 1 THEN
    RAISE EXCEPTION 'la compra cancelada desaparecio de la tabla';
  END IF;

  UPDATE public.purchase SET status = 'active', cancelled_at = NULL WHERE id = p.id;

  SELECT available_points INTO pts2 FROM public.beneficiary_organization
   WHERE beneficiary_id = p.beneficiary_id AND organization_id = p.organization_id;
  IF pts2 <> pts0 THEN
    RAISE EXCEPTION 'reactivar no restauro los puntos: % -> %', pts0, pts2;
  END IF;

  RAISE EXCEPTION 'ROLLBACK_SELF_CHECK';
END $$;
