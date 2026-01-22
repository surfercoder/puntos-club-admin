import { z } from 'zod';

export const PushNotificationSchema = z.object({
  id: z.string().optional(),
  organization_id: z.string().min(1, 'Organization is required'),
  created_by: z.string().min(1, 'Creator is required'),
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Body is required'),
  data: z.record(z.string(), z.unknown()).optional().nullable(),
  sent_count: z.number().int().min(0).default(0),
  failed_count: z.number().int().min(0).default(0),
  status: z.enum(['draft', 'sending', 'sent', 'failed']).default('draft'),
  sent_at: z.string().optional().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type PushNotificationInput = z.input<typeof PushNotificationSchema>;
export type PushNotificationFormData = z.infer<typeof PushNotificationSchema>;
