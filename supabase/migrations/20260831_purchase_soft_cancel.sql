-- Las asignaciones/ventas ya no se borran fisicamente: se cancelan y quedan en
-- el historial, igual que los canjes (redemption ya tenia status + cancelled_*).

ALTER TABLE public.purchase
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by bigint REFERENCES public.app_user(id),
  ADD COLUMN IF NOT EXISTS cancellation_reason text;

ALTER TABLE public.purchase
  DROP CONSTRAINT IF EXISTS purchase_status_check;
ALTER TABLE public.purchase
  ADD CONSTRAINT purchase_status_check CHECK (status IN ('active', 'cancelled'));

-- Los puntos de una compra cancelada valen 0. Asi un simple UPDATE de status
-- devuelve los puntos por el mismo camino que ya usaba el DELETE.
CREATE OR REPLACE FUNCTION public.update_beneficiary_points_after_purchase()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  old_points integer := 0;
  new_points integer := 0;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    old_points := CASE WHEN OLD.status = 'cancelled' THEN 0 ELSE OLD.points_earned END;
  END IF;
  IF TG_OP <> 'DELETE' THEN
    new_points := CASE WHEN NEW.status = 'cancelled' THEN 0 ELSE NEW.points_earned END;
  END IF;

  IF TG_OP <> 'INSERT' AND old_points <> 0 THEN
    UPDATE public.beneficiary_organization
    SET available_points    = available_points - old_points,
        total_points_earned = total_points_earned - old_points,
        updated_at          = now()
    WHERE beneficiary_id = OLD.beneficiary_id
      AND organization_id = OLD.organization_id;
  END IF;

  IF TG_OP <> 'DELETE' AND new_points <> 0 THEN
    UPDATE public.beneficiary_organization
    SET available_points    = available_points + new_points,
        total_points_earned = total_points_earned + new_points,
        updated_at          = now()
    WHERE beneficiary_id = NEW.beneficiary_id
      AND organization_id = NEW.organization_id;
    IF NOT FOUND THEN
      INSERT INTO public.beneficiary_organization
        (beneficiary_id, organization_id, available_points, total_points_earned)
      VALUES (NEW.beneficiary_id, NEW.organization_id, new_points, new_points);
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- La trazabilidad la garantiza la base, no el codigo: nadie borra una operacion.
-- service_role sigue pudiendo porque hace bypass de RLS (migraciones).
-- Sin RLS habilitado la policy no se evalua, asi que se asegura primero: en la
-- base actual ya esta encendido y el ALTER es idempotente, pero un entorno
-- nuevo se levanta solo con las migraciones.
ALTER TABLE public.purchase ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemption ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS purchase_no_delete ON public.purchase;
CREATE POLICY purchase_no_delete ON public.purchase
  AS RESTRICTIVE FOR DELETE TO public USING (false);

DROP POLICY IF EXISTS redemption_no_delete ON public.redemption;
CREATE POLICY redemption_no_delete ON public.redemption
  AS RESTRICTIVE FOR DELETE TO public USING (false);
