import { z } from 'zod';

export const AppUserSchema = z.object({
  id: z.string().optional(),
  organization_id: z.string(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  username: z.string().nullable().optional(),
  password: z.string().nullable().optional(),
  active: z.boolean().default(true),
});

export type AppUserInput = z.input<typeof AppUserSchema>;
export type AppUser = z.infer<typeof AppUserSchema>;
