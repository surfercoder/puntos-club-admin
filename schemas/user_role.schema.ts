import { z } from 'zod';

export const UserRoleSchema = z.object({
  id: z.string().optional(),
  name: z.enum(['final_user', 'cashier', 'owner', 'collaborator', 'admin']),
  display_name: z.string().min(1, 'Display name is required'),
  description: z.string().optional().nullable().transform(val => val === '' ? null : val),
});

export type UserRoleInput = z.input<typeof UserRoleSchema>;
export type UserRoleFormData = z.infer<typeof UserRoleSchema>;
