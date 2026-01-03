import { z } from 'zod';

export const BranchSchema = z.object({
  id: z.string().optional(),
  organization_id: z.union([z.string(), z.number()]).optional(),
  address_id: z.string().min(1, 'Address is required'),
  name: z.string().min(1),
  code: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  active: z.union([z.boolean(), z.string()]).transform((val) => val === true || val === 'true').default(true),
});

export type BranchInput = z.input<typeof BranchSchema>;
export type Branch = z.infer<typeof BranchSchema>;
