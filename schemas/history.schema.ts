import { z } from 'zod';

export const HistorySchema = z.object({
  id: z.string().optional(),
  order_id: z.string().min(1, 'Order is required'),
  status_id: z.string().optional().or(z.literal('')).transform(val => val === '' ? null : val),
  change_date: z.string().optional(),
  observations: z.string().optional().or(z.literal('')).transform(val => val === '' ? null : val),
});

export type HistoryInput = z.input<typeof HistorySchema>;
export type History = z.infer<typeof HistorySchema>;
