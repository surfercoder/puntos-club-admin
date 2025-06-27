import { z } from 'zod';

export const AppOrderSchema = z.object({
  id: z.string().optional(),
  order_number: z.string().min(1),
  creation_date: z.string().optional(),
  total_points: z.number().int(),
  observations: z.string().nullable().optional(),
});

export type AppOrderInput = z.input<typeof AppOrderSchema>;
export type AppOrder = z.infer<typeof AppOrderSchema>;
