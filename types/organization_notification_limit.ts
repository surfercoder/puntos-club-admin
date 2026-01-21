import type { Organization } from './organization';

export type NotificationPlanType = 'free' | 'light' | 'pro' | 'premium';

export type OrganizationNotificationLimit = {
  id: string;
  organization_id: string;
  plan_type: NotificationPlanType;
  daily_limit: number;
  monthly_limit: number;
  min_hours_between_notifications: number;
  notifications_sent_today: number;
  notifications_sent_this_month: number;
  last_notification_sent_at?: string | null;
  reset_daily_at: string;
  reset_monthly_at: string;
  created_at: string;
  updated_at: string;
};

export type OrganizationNotificationLimitWithRelations = OrganizationNotificationLimit & {
  organization?: Organization;
};

export const PLAN_LIMITS: Record<NotificationPlanType, { daily: number; monthly: number; minHours: number }> = {
  free: { daily: 1, monthly: 5, minHours: 24 },
  light: { daily: 2, monthly: 15, minHours: 12 },
  pro: { daily: 3, monthly: 30, minHours: 8 },
  premium: { daily: 5, monthly: 50, minHours: 4 },
};
