-- =====================================================================
-- Clubes para mayores de 18 (ticket Trello "V1 solución a menores de 18")
-- =====================================================================
-- El owner lo marca en el onboarding (o después, en el perfil del club).
-- Las apps de beneficiario, antes de unirse a un club con el flag, preguntan
-- "¿Sos mayor de 18 años?" al estilo de las webs de bebidas: el "No" no une.
--
-- Es una declaración, no una verificación: beneficiary no guarda fecha de
-- nacimiento, así que la base no puede validar la edad.
-- =====================================================================

ALTER TABLE public.organization
  ADD COLUMN IF NOT EXISTS adults_only boolean NOT NULL DEFAULT false;
