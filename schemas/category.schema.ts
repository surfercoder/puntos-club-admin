import { z } from 'zod';

export const CategorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  active: z.boolean().default(true),
});

export type CategoryInput = z.input<typeof CategorySchema>;
export type Category = z.infer<typeof CategorySchema>;
