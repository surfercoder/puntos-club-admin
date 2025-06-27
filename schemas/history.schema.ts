import { z } from 'zod';

export const HistorySchema = z.object({
  id: z.string().optional(),
  order_id: z.string(),
  status_id: z.string().nullable().optional(),
  change_date: z.string().optional(),
  observations: z.string().nullable().optional(),
});

export type HistoryInput = z.input<typeof HistorySchema>;
export type History = z.infer<typeof HistorySchema>;
