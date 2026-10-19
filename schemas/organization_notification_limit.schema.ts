import { z } from 'zod';

export const OrganizationNotificationLimitSchema = z.object({
  id: z.string().optional(),
  organization_id: z.string().min(1, 'organizationRequired'),
  plan_type: z.enum(['free', 'light', 'pro', 'premium']).default('free'),
  daily_limit: z.number().int().min(1).default(1),
  min_hours_between_notifications: z.number().int().min(1).default(24),
  last_notification_sent_at: z.string().optional().nullable(),
  reset_daily_at: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

