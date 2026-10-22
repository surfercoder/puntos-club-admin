-- =====================================================================
-- Branding de la org en las apps de beneficiario (ticket Trello "brandear
-- la app con los colores del logo del owner")
-- =====================================================================
-- 1. organization.brand_color: un solo color semilla (#RRGGBB) que el owner
--    elige entre los colores extraídos de su logo. La paleta completa NO se
--    guarda: la derivan las apps (brandPalette en theme.ts), así podemos
--    retocar la combinación sin migrar datos. NULL = colores de Puntos Club.
--    Solo pinta las pantallas de la org (detalle, historial, catálogo); la
--    home y Explorar siguen siendo Puntos Club porque mezclan clubes.
--
-- 2. El flag white_label (que ya existía, sin pantalla) pasa a incluir Pro.
--    Bajar de plan no borra el color, igual que el resto de los flags: solo
--    impide cambiarlo.
-- =====================================================================

ALTER TABLE public.organization
  ADD COLUMN IF NOT EXISTS brand_color text
  CHECK (brand_color ~ '^#[0-9A-F]{6}$');

UPDATE public.plan_limits
SET limit_value = 1
WHERE plan = 'pro' AND feature = 'white_label';

UPDATE public.organization_plan_limits opl
SET limit_value = 1
FROM public.organization o
WHERE o.id = opl.organization_id
  AND o.plan = 'pro'
  AND opl.feature = 'white_label'
  AND opl.limit_value = 0;
