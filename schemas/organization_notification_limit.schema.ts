import { z } from 'zod';

export const OrganizationNotificationLimitSchema = z.object({
  id: z.string().optional(),
  organization_id: z.string().min(1, 'Organization is required'),
  plan_type: z.enum(['free', 'light', 'pro', 'premium']).default('free'),
  daily_limit: z.number().int().min(1).default(1),
  monthly_limit: z.number().int().min(1).default(5),
  min_hours_between_notifications: z.number().int().min(1).default(24),
  notifications_sent_today: z.number().int().min(0).default(0),
  notifications_sent_this_month: z.number().int().min(0).default(0),
  last_notification_sent_at: z.string().optional().nullable(),
  reset_daily_at: z.string().optional(),
  reset_monthly_at: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type OrganizationNotificationLimitInput = z.input<typeof OrganizationNotificationLimitSchema>;
export type OrganizationNotificationLimitFormData = z.infer<typeof OrganizationNotificationLimitSchema>;
