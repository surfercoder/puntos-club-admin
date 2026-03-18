import { z } from 'zod';

export const PlanLimitSchema = z.object({
  id: z.string().optional(),
  plan: z.enum(['trial', 'advance', 'pro']),
  feature: z.enum(['beneficiaries', 'push_notifications_monthly', 'cashiers', 'branches', 'collaborators', 'redeemable_products']),
  limit_value: z.union([z.number(), z.string()]).transform(val => {
    const num = typeof val === 'string' ? parseInt(val, 10) : val;
    if (isNaN(num) || num < 0) throw new Error('Limit value must be a non-negative number');
    return num;
  }),
  warning_threshold: z.union([z.number(), z.string()]).transform(val => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return 0.8;
    return num;
  }).default(0.8),
});

export type PlanLimitInput = z.input<typeof PlanLimitSchema>;
export type PlanLimitFormData = z.infer<typeof PlanLimitSchema>;
