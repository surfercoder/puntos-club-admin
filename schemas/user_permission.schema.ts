import { z } from 'zod';

export const UserPermissionSchema = z.object({
  id: z.string().optional(),
  user_id: z.string().min(1, 'User is required'),
  branch_id: z.string().min(1, 'Branch is required'),
  action: z.string().min(1, 'Action is required'),
  assignment_date: z.string().optional(),
});

export type UserPermissionInput = z.input<typeof UserPermissionSchema>;
export type UserPermission = z.infer<typeof UserPermissionSchema>;
