import { z } from 'zod';

export const PushNotificationRecipientSchema = z.object({
  id: z.string().optional(),
  push_notification_id: z.string().min(1, 'Push notification is required'),
  beneficiary_id: z.string().min(1, 'Beneficiary is required'),
  push_token_id: z.string().optional().nullable(),
  status: z.enum(['pending', 'sent', 'failed', 'read']).default('pending'),
  error_message: z.string().optional().nullable(),
  sent_at: z.string().optional().nullable(),
  read_at: z.string().optional().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type PushNotificationRecipientInput = z.input<typeof PushNotificationRecipientSchema>;
export type PushNotificationRecipientFormData = z.infer<typeof PushNotificationRecipientSchema>;
