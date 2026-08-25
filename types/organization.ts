import type { PlanType } from './plan';

export type Organization = {
  id: string;
  name: string;
  business_name?: string | null;
  tax_id?: string | null;
  public_info?: string | null;
  logo_url?: string | null;
  creation_date: string;
  plan: PlanType;
  trial_started_at?: string | null;
  is_public?: boolean;
  description?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  website?: string | null;
  industry?: string | null;
  invitation_code?: string | null;
  welcome_message?: string | null;
  points_label?: string | null;
  allow_new_members?: boolean;
  requires_approval?: boolean;
  email_notifications?: boolean;
  show_in_explore?: boolean;
  timezone?: string | null;
};

