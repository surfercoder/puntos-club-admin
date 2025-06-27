import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.string().optional(),
  subcategory_id: z.string(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  required_points: z.number().int().min(0),
  active: z.boolean().default(true),
  creation_date: z.string().optional(),
});

export type ProductInput = z.input<typeof ProductSchema>;
export type Product = z.infer<typeof ProductSchema>;
