import { z } from 'zod';

export const StockSchema = z.object({
  id: z.string().optional(),
  branch_id: z.string().min(1, 'Branch is required'),
  product_id: z.string().min(1, 'Product is required'),
  quantity: z.union([z.number(), z.string()]).transform(val => {
    if (typeof val === 'number') return val;
    return parseInt(val) || 0;
  }),
  minimum_quantity: z.union([z.number(), z.string()]).transform(val => {
    if (typeof val === 'number') return val;
    return parseInt(val) || 0;
  }),
});

