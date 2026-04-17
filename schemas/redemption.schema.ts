import { z } from 'zod';

export const RedemptionSchema = z.object({
  id: z.string().optional(),
  beneficiary_id: z.string().min(1, 'Beneficiary is required'),
  product_id: z.string().min(1, 'Product is required'),
  organization_id: z.string().optional().or(z.literal('')).transform(val => val === '' ? null : val),
  points_used: z.union([z.number(), z.string()]).transform(val => {
    if (typeof val === 'number') return val;
    return parseInt(val) || 0;
  }),
  redemption_date: z.string().optional(),
});
