import { z } from 'zod';

export const BranchSchema = z.object({
  id: z.string().optional(),
  organization_id: z.string(),
  address_id: z.string().nullable().optional(),
  name: z.string().min(1),
  code: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  active: z.boolean().default(true),
});

export type BranchInput = z.input<typeof BranchSchema>;
export type Branch = z.infer<typeof BranchSchema>;
