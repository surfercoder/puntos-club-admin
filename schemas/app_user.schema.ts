import { z } from 'zod';

export const AppUserSchema = z.object({
  id: z.string().optional(),
  organization_id: z.string().min(1, 'Organization is required'),
  first_name: z.string().optional().or(z.literal('')).transform(val => val === '' ? null : val),
  last_name: z.string().optional().or(z.literal('')).transform(val => val === '' ? null : val),
  email: z.string().email('Invalid email').optional().or(z.literal('')).transform(val => val === '' ? null : val),
  username: z.string().optional().or(z.literal('')).transform(val => val === '' ? null : val),
  password: z.string().optional().or(z.literal('')).transform(val => val === '' ? null : val),
  active: z.union([z.boolean(), z.string()]).transform(val => {
    if (typeof val === 'boolean') return val;
    return val === 'true' || val === 'on';
  }).default(true),
});

export type AppUserInput = z.input<typeof AppUserSchema>;
export type AppUser = z.infer<typeof AppUserSchema>;
