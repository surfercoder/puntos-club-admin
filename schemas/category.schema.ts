import { z } from 'zod';

export const CategorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().or(z.literal('')).transform(val => val === '' ? null : val),
  active: z.union([z.boolean(), z.string()]).transform(val => {
    if (typeof val === 'boolean') return val;
    return val === 'true' || val === 'on';
  }).default(true),
});

export type CategoryInput = z.input<typeof CategorySchema>;
export type Category = z.infer<typeof CategorySchema>;
