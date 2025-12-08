import { z } from 'zod';

export const SubcategorySchema = z.object({
  id: z.string().optional(),
  category_id: z.string().min(1, 'Category is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().or(z.literal('')).transform(val => val === '' ? null : val),
  active: z.union([z.boolean(), z.string()]).transform(val => {
    if (typeof val === 'boolean') return val;
    return val === 'true' || val === 'on';
  }).default(true),
});

export type SubcategoryInput = z.input<typeof SubcategorySchema>;
export type Subcategory = z.infer<typeof SubcategorySchema>;
