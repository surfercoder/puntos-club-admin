import { z } from 'zod';

export const StockSchema = z.object({
  id: z.string().optional(),
  branch_id: z.string(),
  product_id: z.string(),
  quantity: z.number().int().min(0),
  minimum_quantity: z.number().int().min(0),
  last_updated: z.string().optional(),
});

export type StockInput = z.input<typeof StockSchema>;
export type Stock = z.infer<typeof StockSchema>;
