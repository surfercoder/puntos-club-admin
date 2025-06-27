import { z } from 'zod';

export const StatusSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  is_terminal: z.boolean().default(false),
  order_num: z.number().int(),
});

export type StatusInput = z.input<typeof StatusSchema>;
export type Status = z.infer<typeof StatusSchema>;
