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
});
