export type NotificationPlanType = 'free' | 'light' | 'pro' | 'premium';

export type OrganizationNotificationLimit = {
  id: string;
  organization_id: string;
  plan_type: NotificationPlanType;
  daily_limit: number;
  /** Total cargado (plan + superadmin + compras). Lo mantiene un trigger sobre notification_credit. */
  notifications_granted: number;
  min_hours_between_notifications: number;
  notifications_sent_today: number;
  /** Envíos descontados del saldo. No se reinicia. */
  notifications_used: number;
  last_notification_sent_at?: string | null;
  reset_daily_at: string;
  created_at: string;
  updated_at: string;
};


export const PLAN_LIMITS: Record<NotificationPlanType, { daily: number; minHours: number }> = {
  free: { daily: 1, minHours: 24 },
  light: { daily: 2, minHours: 12 },
  pro: { daily: 3, minHours: 8 },
  premium: { daily: 5, minHours: 4 },
};
