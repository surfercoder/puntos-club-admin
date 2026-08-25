import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.string().optional(),
  // Vacío es válido sólo si el formulario mandó `new_category`; la acción crea
  // la categoría y completa este campo antes de guardar el producto.
  category_id: z.string().min(1, 'Category is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().or(z.literal('')).transform(val => val === '' ? null : val),
  required_points: z.union([z.number(), z.string()]).transform(val => {
    if (typeof val === 'number') return val;
    return parseInt(val) || 0;
  }),
  stock: z.union([z.number(), z.string()]).transform(val => {
    const parsed = typeof val === 'number' ? val : parseInt(val) || 0;
    return Math.max(0, parsed);
  }),

  creation_date: z.string().optional(),
  image_urls: z.array(z.string()).max(3, 'Maximum 3 images allowed').optional(),
});

