-- =====================================================================
-- Orden del catálogo (ticket Trello "V2 Orden del catálogo")
-- =====================================================================
-- product.sort_order: posición que elige el owner arrastrando filas en el
-- admin. Las apps ordenan por sort_order y desempatan por required_points.
-- NULL = nunca se reordenó (productos nuevos): va al final, por puntos.
-- El backfill reproduce el orden que veían hasta hoy (por puntos).
--
-- reorder_products: un solo UPDATE para toda la lista. SECURITY INVOKER, así
-- que corre bajo la RLS de product; el filtro por org es el mismo que hace
-- updateProduct, porque la policy del admin portal no restringe por org.
-- =====================================================================

ALTER TABLE public.product ADD COLUMN IF NOT EXISTS sort_order integer;

UPDATE public.product p
SET sort_order = r.pos
FROM (
  SELECT id, row_number() OVER (PARTITION BY organization_id ORDER BY required_points, id) AS pos
  FROM public.product
) r
WHERE r.id = p.id AND p.sort_order IS NULL;

CREATE OR REPLACE FUNCTION public.reorder_products(p_organization_id bigint, p_product_ids bigint[])
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  UPDATE public.product p
  SET sort_order = t.pos
  FROM unnest(p_product_ids) WITH ORDINALITY AS t(id, pos)
  WHERE p.id = t.id AND p.organization_id = p_organization_id;
$$;

REVOKE EXECUTE ON FUNCTION public.reorder_products(bigint, bigint[]) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.reorder_products(bigint, bigint[]) TO authenticated;
