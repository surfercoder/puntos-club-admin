import { z } from 'zod';

export const AppOrderSchema = z.object({
  id: z.string().optional(),
  order_number: z.string().min(1, 'Order number is required'),
  creation_date: z.string().optional(),
  total_points: z.union([z.number(), z.string()]).transform(val => {
    if (typeof val === 'number') return val;
    return parseInt(val) || 0;
  }),
  observations: z.string().optional().or(z.literal('')).transform(val => val === '' ? null : val),
});

export type AppOrderInput = z.input<typeof AppOrderSchema>;
export type AppOrder = z.infer<typeof AppOrderSchema>;
