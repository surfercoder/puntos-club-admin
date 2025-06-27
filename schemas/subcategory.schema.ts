import { z } from 'zod';

export const SubcategorySchema = z.object({
  id: z.string().optional(),
  category_id: z.string(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  active: z.boolean().default(true),
});

export type SubcategoryInput = z.input<typeof SubcategorySchema>;
export type Subcategory = z.infer<typeof SubcategorySchema>;
