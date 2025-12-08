import { z } from 'zod';

export const RedemptionSchema = z.object({
  id: z.string().optional(),
  beneficiary_id: z.string().min(1, 'Beneficiary is required'),
  product_id: z.string().optional().or(z.literal('')).transform(val => val === '' ? null : val),
  order_id: z.string().min(1, 'Order is required'),
  points_used: z.union([z.number(), z.string()]).transform(val => {
    if (typeof val === 'number') return val;
    return parseInt(val) || 0;
  }),
  quantity: z.union([z.number(), z.string()]).transform(val => {
    if (typeof val === 'number') return val;
    return parseInt(val) || 0;
  }),
  redemption_date: z.string().optional(),
});

export type RedemptionInput = z.input<typeof RedemptionSchema>;
export type Redemption = z.infer<typeof RedemptionSchema>;
