import { z } from 'zod';

export const AppUserSchema = z.object({
  id: z.string().optional(),
  first_name: z.string().optional().or(z.literal('')).transform(val => val === '' ? null : val),
  last_name: z.string().optional().or(z.literal('')).transform(val => val === '' ? null : val),
  email: z.string().email('Invalid email').optional().or(z.literal('')).transform(val => val === '' ? null : val),
  password: z.string().optional().or(z.literal('')).transform(val => val === '' ? null : val),
  role_id: z.string().optional().nullable(),
});
