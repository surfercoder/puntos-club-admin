import { z } from 'zod';

export const PushTokenSchema = z.object({
  id: z.string().optional(),
  beneficiary_id: z.string().min(1, 'Beneficiary is required'),
  expo_push_token: z.string().min(1, 'Expo push token is required'),
  device_id: z.string().optional().nullable(),
  platform: z.enum(['ios', 'android', 'web']).optional().nullable(),
  is_active: z.union([z.boolean(), z.string()]).transform(val => {
    if (typeof val === 'boolean') return val;
    return val === 'true' || val === 'on';
  }).default(true),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type PushTokenInput = z.input<typeof PushTokenSchema>;
export type PushTokenFormData = z.infer<typeof PushTokenSchema>;
