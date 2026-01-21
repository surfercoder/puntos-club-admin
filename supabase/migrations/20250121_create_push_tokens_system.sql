-- Create push_tokens table
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_id UUID NOT NULL REFERENCES public.beneficiary(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL,
  device_id TEXT,
  platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create push_notifications table (different from notifications table)
CREATE TABLE IF NOT EXISTS public.push_notifications (
  id SERIAL PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organization(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.app_user(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create push_notification_recipients table
CREATE TABLE IF NOT EXISTS public.push_notification_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  push_notification_id INTEGER NOT NULL REFERENCES public.push_notifications(id) ON DELETE CASCADE,
  beneficiary_id UUID NOT NULL REFERENCES public.beneficiary(id) ON DELETE CASCADE,
  push_token_id UUID NOT NULL REFERENCES public.push_tokens(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_push_tokens_beneficiary_id ON public.push_tokens(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_expo_push_token ON public.push_tokens(expo_push_token);
CREATE INDEX IF NOT EXISTS idx_push_tokens_is_active ON public.push_tokens(is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_push_tokens_beneficiary_expo_token ON public.push_tokens(beneficiary_id, expo_push_token);

CREATE INDEX IF NOT EXISTS idx_push_notifications_organization_id ON public.push_notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_push_notifications_status ON public.push_notifications(status);
CREATE INDEX IF NOT EXISTS idx_push_notifications_created_by ON public.push_notifications(created_by);

CREATE INDEX IF NOT EXISTS idx_push_notification_recipients_notification_id ON public.push_notification_recipients(push_notification_id);
CREATE INDEX IF NOT EXISTS idx_push_notification_recipients_beneficiary_id ON public.push_notification_recipients(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_push_notification_recipients_status ON public.push_notification_recipients(status);

-- Enable RLS
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_notification_recipients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for push_tokens
-- Beneficiaries can view and manage their own push tokens
CREATE POLICY "Beneficiaries can view their own push tokens"
  ON public.push_tokens
  FOR SELECT
  USING (
    beneficiary_id IN (
      SELECT id 
      FROM public.beneficiary 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Beneficiaries can insert their own push tokens"
  ON public.push_tokens
  FOR INSERT
  WITH CHECK (
    beneficiary_id IN (
      SELECT id 
      FROM public.beneficiary 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Beneficiaries can update their own push tokens"
  ON public.push_tokens
  FOR UPDATE
  USING (
    beneficiary_id IN (
      SELECT id 
      FROM public.beneficiary 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Beneficiaries can delete their own push tokens"
  ON public.push_tokens
  FOR DELETE
  USING (
    beneficiary_id IN (
      SELECT id 
      FROM public.beneficiary 
      WHERE auth_user_id = auth.uid()
    )
  );

-- RLS Policies for push_notifications
CREATE POLICY "Users can view their organization's push notifications"
  ON public.push_notifications
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.app_user 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create push notifications for their organization"
  ON public.push_notifications
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM public.app_user 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their organization's push notifications"
  ON public.push_notifications
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.app_user 
      WHERE auth_user_id = auth.uid()
    )
  );

-- RLS Policies for push_notification_recipients
CREATE POLICY "Users can view recipients for their organization's notifications"
  ON public.push_notification_recipients
  FOR SELECT
  USING (
    push_notification_id IN (
      SELECT id 
      FROM public.push_notifications 
      WHERE organization_id IN (
        SELECT organization_id 
        FROM public.app_user 
        WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert recipients for their organization's notifications"
  ON public.push_notification_recipients
  FOR INSERT
  WITH CHECK (
    push_notification_id IN (
      SELECT id 
      FROM public.push_notifications 
      WHERE organization_id IN (
        SELECT organization_id 
        FROM public.app_user 
        WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update recipients for their organization's notifications"
  ON public.push_notification_recipients
  FOR UPDATE
  USING (
    push_notification_id IN (
      SELECT id 
      FROM public.push_notifications 
      WHERE organization_id IN (
        SELECT organization_id 
        FROM public.app_user 
        WHERE auth_user_id = auth.uid()
      )
    )
  );
