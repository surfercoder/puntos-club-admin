import { z } from 'zod';

import { PLAN_FEATURE_ORDER, PLAN_ORDER, isValidLimitValue } from '@/lib/plans/config';

export const PlanLimitSchema = z.object({
  id: z.string().optional(),
  // Un solo catálogo de planes y features: el de lib/plans/config.
  plan: z.enum(PLAN_ORDER),
  feature: z.enum(PLAN_FEATURE_ORDER),
  limit_value: z.union([z.number(), z.string()]).transform(val => {
    const num = typeof val === 'string' ? parseInt(val, 10) : val;
    if (isNaN(num)) throw new Error('Limit value must be a number');
    return num;
  }),
  warning_threshold: z.union([z.number(), z.string()]).transform(val => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return 0.8;
    return num;
  }).default(0.8),
}).refine((values) => isValidLimitValue(values.feature, values.limit_value), {
  path: ['limit_value'],
  message: 'Quotas accept -1 or a cap >= 0; feature flags accept only 0 or 1',
});