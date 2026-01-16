import { z } from 'zod';

export const BeneficiarySchema = z.object({
  id: z.string().optional(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  document_id: z.string().nullable().optional(),
  available_points: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? 0 : parsed;
      }
      return val;
    },
    z.number().int().min(0).default(0)
  ),
  registration_date: z.string().optional(),
  address_id: z.string().nullable().optional(),
});

export type BeneficiaryInput = z.input<typeof BeneficiarySchema>;
export type Beneficiary = z.infer<typeof BeneficiarySchema>;
