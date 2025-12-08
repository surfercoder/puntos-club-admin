import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.string().optional(),
  subcategory_id: z.string().min(1, 'Subcategory is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().or(z.literal('')).transform(val => val === '' ? null : val),
  required_points: z.union([z.number(), z.string()]).transform(val => {
    if (typeof val === 'number') return val;
    return parseInt(val) || 0;
  }),
  active: z.union([z.boolean(), z.string()]).transform(val => {
    if (typeof val === 'boolean') return val;
    return val === 'true' || val === 'on';
  }).default(true),
  creation_date: z.string().optional(),
});

export type ProductInput = z.input<typeof ProductSchema>;
export type Product = z.infer<typeof ProductSchema>;
