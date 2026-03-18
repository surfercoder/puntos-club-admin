import { z } from 'zod';

export const BeneficiarySchema = z.object({
  id: z.string().optional(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  document_id: z.string().nullable().optional(),
  registration_date: z.string().optional(),
  address_id: z.string().nullable().optional(),
});

export type BeneficiaryInput = z.input<typeof BeneficiarySchema>;
export type Beneficiary = z.infer<typeof BeneficiarySchema>;
