import { z } from 'zod';

export const PurchaseSchema = z.object({
  id: z.string().optional(),
  beneficiary_id: z.string().min(1, 'Beneficiary is required'),
  cashier_id: z.string().min(1, 'Cashier is required'),
  branch_id: z.string().optional().nullable().transform(val => val === '' ? null : val),
  total_amount: z.union([z.number(), z.string()]).transform(val => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num) || num < 0) throw new Error('Amount must be a non-negative number');
    return num;
  }),
  points_earned: z.union([z.number(), z.string()]).transform(val => {
    const num = typeof val === 'string' ? parseInt(val, 10) : val;
    if (isNaN(num) || num < 0) return 0;
    return num;
  }).default(0),
  notes: z.string().optional().nullable().transform(val => val === '' ? null : val),
  organization_id: z.string().optional().nullable().transform(val => val === '' ? null : val),
});

export type PurchaseInput = z.input<typeof PurchaseSchema>;
export type PurchaseFormData = z.infer<typeof PurchaseSchema>;
