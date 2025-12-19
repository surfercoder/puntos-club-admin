import { z } from 'zod';

export const CollaboratorPermissionSchema = z.object({
  id: z.string().optional(),
  collaborator_id: z.string().min(1, 'Collaborator is required'),
  permission_type: z.string().min(1, 'Permission type is required'),
  can_execute: z
    .union([z.boolean(), z.string()])
    .transform((val) => {
      if (typeof val === 'boolean') return val;
      return val === 'true' || val === 'on';
    })
    .default(true)
    .optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type CollaboratorPermissionInput = z.input<typeof CollaboratorPermissionSchema>;
export type CollaboratorPermission = z.infer<typeof CollaboratorPermissionSchema>;
