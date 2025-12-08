import { z } from 'zod';

export const StatusSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().or(z.literal('')).transform(val => val === '' ? null : val),
  is_terminal: z.union([z.boolean(), z.string()]).transform(val => {
    if (typeof val === 'boolean') return val;
    return val === 'true' || val === 'on';
  }).default(false),
  order_num: z.union([z.number(), z.string()]).transform(val => {
    if (typeof val === 'number') return val;
    return parseInt(val) || 0;
  }),
});

export type StatusInput = z.input<typeof StatusSchema>;
export type Status = z.infer<typeof StatusSchema>;
