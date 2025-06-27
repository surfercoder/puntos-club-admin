import { z } from 'zod';

export const UserPermissionSchema = z.object({
  id: z.string().optional(),
  user_id: z.string(),
  branch_id: z.string(),
  action: z.string().min(1),
  assignment_date: z.string().optional(),
});

export type UserPermissionInput = z.input<typeof UserPermissionSchema>;
export type UserPermission = z.infer<typeof UserPermissionSchema>;
