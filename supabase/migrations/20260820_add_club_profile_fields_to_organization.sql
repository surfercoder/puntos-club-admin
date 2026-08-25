-- Campos que pide la pantalla "Perfil del Club" del rediseño. Todos opcionales
-- o con default seguro para no tocar los clubes que ya existen.

ALTER TABLE public.organization
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS industry text,
  ADD COLUMN IF NOT EXISTS invitation_code text,
  ADD COLUMN IF NOT EXISTS welcome_message text,
  ADD COLUMN IF NOT EXISTS points_label text NOT NULL DEFAULT 'puntos',
  ADD COLUMN IF NOT EXISTS allow_new_members boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS requires_approval boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_notifications boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_in_explore boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.organization.invitation_code IS
  'Código corto que un beneficiario puede tipear para unirse sin escanear el QR.';
COMMENT ON COLUMN public.organization.points_label IS
  'Cómo se nombran los puntos en la app del beneficiario (puntos, estrellas, etc).';
COMMENT ON COLUMN public.organization.show_in_explore IS
  'Si el club aparece en la sección Explorar de la app, independiente de is_public.';

CREATE UNIQUE INDEX IF NOT EXISTS organization_invitation_code_key
  ON public.organization (upper(invitation_code))
  WHERE invitation_code IS NOT NULL;
