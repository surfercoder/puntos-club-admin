import { z } from 'zod';

export const RedemptionSchema = z.object({
  id: z.string().optional(),
  beneficiary_id: z.string(),
  product_id: z.string().nullable().optional(),
  order_id: z.string(),
  points_used: z.number().int(),
  quantity: z.number().int(),
  redemption_date: z.string().optional(),
});

export type RedemptionInput = z.input<typeof RedemptionSchema>;
export type Redemption = z.infer<typeof RedemptionSchema>;
