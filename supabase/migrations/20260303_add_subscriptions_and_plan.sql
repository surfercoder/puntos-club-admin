-- Add plan and trial tracking to organization
ALTER TABLE public.organization
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'trial'
    CHECK (plan IN ('trial', 'advance', 'pro')),
  ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ DEFAULT NOW();

-- Subscription table — tracks Mercado Pago preapproval records
CREATE TABLE IF NOT EXISTS public.subscription (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES public.organization(id) ON DELETE CASCADE,
  mp_preapproval_id TEXT NOT NULL UNIQUE,
  mp_plan_id TEXT NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('advance', 'pro')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'authorized', 'paused', 'cancelled')),
  payer_email TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ARS',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_organization_id ON public.subscription(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscription_mp_preapproval_id ON public.subscription(mp_preapproval_id);
CREATE INDEX IF NOT EXISTS idx_subscription_status ON public.subscription(status);

-- Enable RLS
ALTER TABLE public.subscription ENABLE ROW LEVEL SECURITY;

-- Owners can view their organization's subscriptions
CREATE POLICY "owners_view_subscriptions"
  ON public.subscription FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.app_user
      WHERE auth_user_id = auth.uid()
    )
  );

-- Service role (backend) can do everything — handled via admin client
CREATE POLICY "service_role_manage_subscriptions"
  ON public.subscription FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
