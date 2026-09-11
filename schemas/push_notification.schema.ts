import { z } from 'zod';

export const PushNotificationSchema = z.object({
  id: z.string().optional(),
  organization_id: z.string().min(1, 'organizationRequired'),
  created_by: z.string().min(1, 'creatorRequired'),
  title: z.string().min(1, 'titleRequired'),
  body: z.string().min(1, 'bodyRequired'),
  data: z.record(z.string(), z.unknown()).optional().nullable(),
  sent_count: z.number().int().min(0).default(0),
  failed_count: z.number().int().min(0).default(0),
  status: z.enum(['draft', 'sending', 'sent', 'failed']).default('draft'),
  sent_at: z.string().optional().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

