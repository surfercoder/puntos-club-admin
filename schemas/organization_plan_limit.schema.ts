import { z } from 'zod';

export const OrganizationPlanLimitSchema = z.object({
  id: z.string().optional(),
  organization_id: z.string().min(1, 'Organization is required'),
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

export type OrganizationPlanLimitInput = z.input<typeof OrganizationPlanLimitSchema>;
export type OrganizationPlanLimitFormData = z.infer<typeof OrganizationPlanLimitSchema>;
