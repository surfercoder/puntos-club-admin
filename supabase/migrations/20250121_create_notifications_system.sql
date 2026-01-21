-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organization(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'failed')),
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create organization_notification_limits table
CREATE TABLE IF NOT EXISTS public.organization_notification_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES public.organization(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'light', 'pro', 'premium')),
  daily_limit INTEGER NOT NULL DEFAULT 1,
  monthly_limit INTEGER NOT NULL DEFAULT 5,
  min_hours_between_notifications INTEGER NOT NULL DEFAULT 24,
  notifications_sent_today INTEGER NOT NULL DEFAULT 0,
  notifications_sent_this_month INTEGER NOT NULL DEFAULT 0,
  last_notification_sent_at TIMESTAMPTZ,
  reset_daily_at TIMESTAMPTZ NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 day'),
  reset_monthly_at TIMESTAMPTZ NOT NULL DEFAULT (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_organization_id ON public.notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);
CREATE INDEX IF NOT EXISTS idx_organization_notification_limits_organization_id ON public.organization_notification_limits(organization_id);

-- Create function to check if organization can send notification
CREATE OR REPLACE FUNCTION public.can_send_notification(org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  limits_record RECORD;
  hours_since_last NUMERIC;
BEGIN
  -- Get the limits for this organization
  SELECT * INTO limits_record
  FROM public.organization_notification_limits
  WHERE organization_id = org_id;

  -- If no limits record exists, return false
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Reset daily counter if needed
  IF NOW() >= limits_record.reset_daily_at THEN
    UPDATE public.organization_notification_limits
    SET 
      notifications_sent_today = 0,
      reset_daily_at = (CURRENT_DATE + INTERVAL '1 day'),
      updated_at = NOW()
    WHERE organization_id = org_id;
    
    limits_record.notifications_sent_today := 0;
  END IF;

  -- Reset monthly counter if needed
  IF NOW() >= limits_record.reset_monthly_at THEN
    UPDATE public.organization_notification_limits
    SET 
      notifications_sent_this_month = 0,
      reset_monthly_at = (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'),
      updated_at = NOW()
    WHERE organization_id = org_id;
    
    limits_record.notifications_sent_this_month := 0;
  END IF;

  -- Check daily limit
  IF limits_record.notifications_sent_today >= limits_record.daily_limit THEN
    RETURN FALSE;
  END IF;

  -- Check monthly limit
  IF limits_record.notifications_sent_this_month >= limits_record.monthly_limit THEN
    RETURN FALSE;
  END IF;

  -- Check minimum hours between notifications
  IF limits_record.last_notification_sent_at IS NOT NULL THEN
    hours_since_last := EXTRACT(EPOCH FROM (NOW() - limits_record.last_notification_sent_at)) / 3600;
    IF hours_since_last < limits_record.min_hours_between_notifications THEN
      RETURN FALSE;
    END IF;
  END IF;

  RETURN TRUE;
END;
$$;

-- Create function to update notification counters after sending
CREATE OR REPLACE FUNCTION public.increment_notification_counters(org_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.organization_notification_limits
  SET 
    notifications_sent_today = notifications_sent_today + 1,
    notifications_sent_this_month = notifications_sent_this_month + 1,
    last_notification_sent_at = NOW(),
    updated_at = NOW()
  WHERE organization_id = org_id;
END;
$$;

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_notification_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their organization's notifications"
  ON public.notifications
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.app_user 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create notifications for their organization"
  ON public.notifications
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM public.app_user 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their organization's notifications"
  ON public.notifications
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.app_user 
      WHERE auth_user_id = auth.uid()
    )
  );

-- RLS Policies for organization_notification_limits
CREATE POLICY "Users can view their organization's notification limits"
  ON public.organization_notification_limits
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.app_user 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their organization's notification limits"
  ON public.organization_notification_limits
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.app_user 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their organization's notification limits"
  ON public.organization_notification_limits
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM public.app_user 
      WHERE auth_user_id = auth.uid()
    )
  );
