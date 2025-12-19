import { z } from 'zod';

export const RestrictedCollaboratorActionSchema = z.object({
  id: z.string().optional(),
  action_name: z.string().min(1, 'Action name is required'),
  description: z.string().optional().or(z.literal('')).transform((val) => (val === '' ? null : val)),
  created_at: z.string().optional(),
});

export type RestrictedCollaboratorActionInput = z.input<typeof RestrictedCollaboratorActionSchema>;
export type RestrictedCollaboratorAction = z.infer<typeof RestrictedCollaboratorActionSchema>;
