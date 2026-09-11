-- =====================================================================
-- Cancelar una compra ya gastada no puede romper con un error crudo
-- =====================================================================
-- update_beneficiary_points_after_purchase restaba los puntos sin ningún
-- piso:
--
--     SET available_points = available_points - old_points
--
-- Si el beneficiario ya gastó esos puntos, la resta deja el saldo en
-- negativo, el CHECK (available_points >= 0) de beneficiary_organization
-- aborta con un 23514 y la app lo traduce como "valor inválido", que no
-- le dice nada a quien está intentando cancelar. Hoy hay casos reales:
-- compras cuyo points_earned es mayor que el saldo disponible del socio.
--
-- Segundo problema, del mismo trigger: aplicaba el cambio en dos pasos
-- (restar lo viejo, sumar lo nuevo). Editar una compra para SUBIRLE los
-- puntos podía fallar por el saldo intermedio negativo aunque el estado
-- final fuera perfectamente válido (saldo 50, de 100 a 200 puntos:
-- 50 - 100 = -50 y aborta, cuando el final era 150).
--
-- Los dos se arreglan centralizando la aritmética en un helper que aplica
-- el NETO de una sola vez, bloquea la membresía y corta con un motivo con
-- nombre, como el resto de los RPC (INSUFFICIENT_POINTS, OUT_OF_STOCK...).
-- El guard va en el trigger y no en cada caller porque es el único punto
-- por el que pasan los cinco caminos que escriben `purchase`.
-- =====================================================================

CREATE OR REPLACE FUNCTION private.apply_purchase_points(
  p_beneficiary_id  bigint,
  p_organization_id bigint,
  p_delta           integer
)
RETURNS void
LANGUAGE plpgsql
SET search_path = public, private
AS $$
DECLARE
  v_available integer;
BEGIN
  IF p_delta = 0 THEN
    RETURN;
  END IF;

  -- Se bloquea la membresía antes de leer el saldo: dos movimientos
  -- simultáneos del mismo socio se serializan acá, igual que en
  -- request_redemption.
  SELECT available_points INTO v_available
  FROM public.beneficiary_organization
  WHERE beneficiary_id  = p_beneficiary_id
    AND organization_id = p_organization_id
  FOR UPDATE;

  IF NOT FOUND THEN
    -- Sumando, es la primera compra del socio en el club y se le crea la
    -- membresía (alta implícita, como hacía el trigger). Restando, no hay
    -- saldo del que restar: se mantiene el no-op de siempre.
    IF p_delta > 0 THEN
      INSERT INTO public.beneficiary_organization
        (beneficiary_id, organization_id, available_points, total_points_earned)
      VALUES (p_beneficiary_id, p_organization_id, p_delta, p_delta);
    END IF;
    RETURN;
  END IF;

  IF v_available + p_delta < 0 THEN
    RAISE EXCEPTION 'PURCHASE_POINTS_ALREADY_SPENT' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.beneficiary_organization
  SET available_points    = available_points + p_delta,
      total_points_earned = GREATEST(0, total_points_earned + p_delta),
      updated_at          = now()
  WHERE beneficiary_id  = p_beneficiary_id
    AND organization_id = p_organization_id;
END;
$$;

-- SECURITY INVOKER a propósito (es el default): el UPDATE queda sujeto a las
-- mismas policies de beneficiary_organization que cuando estaba escrito
-- dentro del cuerpo del trigger. No se amplía nada.
GRANT EXECUTE ON FUNCTION private.apply_purchase_points(bigint, bigint, integer)
  TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.update_beneficiary_points_after_purchase()
RETURNS trigger
LANGUAGE plpgsql
-- search_path fijo: el linter de Supabase lo marca como mutable y la migración
-- hermana (check_purchase_membership) ya lo fija.
SET search_path = public, private
AS $$
DECLARE
  old_points integer := 0;
  new_points integer := 0;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    old_points := CASE WHEN OLD.status = 'cancelled' THEN 0
                       ELSE COALESCE(OLD.points_earned, 0) END;
  END IF;
  IF TG_OP <> 'DELETE' THEN
    new_points := CASE WHEN NEW.status = 'cancelled' THEN 0
                       ELSE COALESCE(NEW.points_earned, 0) END;
  END IF;

  -- Cada TG_OP en su propia rama: el AND de SQL no garantiza cortocircuito, así
  -- que mezclar `TG_OP = 'UPDATE' AND OLD.algo` en una sola condición puede
  -- tocar OLD durante un INSERT, donde todavía no está asignado.
  IF TG_OP = 'INSERT' THEN
    PERFORM private.apply_purchase_points(
      NEW.beneficiary_id, NEW.organization_id, new_points);

  ELSIF TG_OP = 'DELETE' THEN
    PERFORM private.apply_purchase_points(
      OLD.beneficiary_id, OLD.organization_id, -old_points);

  ELSIF NEW.beneficiary_id  =                 OLD.beneficiary_id
    AND NEW.organization_id IS NOT DISTINCT FROM OLD.organization_id THEN
    -- Misma membresía: un solo movimiento, con el neto.
    PERFORM private.apply_purchase_points(
      NEW.beneficiary_id, NEW.organization_id, new_points - old_points);

  ELSE
    -- La edición reasignó la compra a otro socio: cada membresía recibe su
    -- parte por separado.
    PERFORM private.apply_purchase_points(
      OLD.beneficiary_id, OLD.organization_id, -old_points);
    PERFORM private.apply_purchase_points(
      NEW.beneficiary_id, NEW.organization_id, new_points);
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;
