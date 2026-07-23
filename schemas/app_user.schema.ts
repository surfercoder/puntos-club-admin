import { z } from 'zod';

export const AppUserSchema = z.object({
  id: z.string().optional(),
  first_name: z.string().optional().or(z.literal('')).transform(val => val === '' ? null : val),
  last_name: z.string().optional().or(z.literal('')).transform(val => val === '' ? null : val),
  email: z.email('Invalid email').optional().or(z.literal('')).transform(val => val === '' ? null : val),
  password: z.string().optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  role_id: z.string().optional().nullable(),
});

export type AppUserInput = z.output<typeof AppUserSchema>;
