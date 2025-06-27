import { z } from 'zod';

export const AssignmentSchema = z.object({
  id: z.string().optional(),
  branch_id: z.string(),
  beneficiary_id: z.string(),
  user_id: z.string().nullable().optional(),
  points: z.number().int(),
  reason: z.string().nullable().optional(),
  assignment_date: z.string().optional(),
  observations: z.string().nullable().optional(),
});

export type AssignmentInput = z.input<typeof AssignmentSchema>;
export type Assignment = z.infer<typeof AssignmentSchema>;
