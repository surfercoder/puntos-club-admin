import { z } from 'zod';

export const BeneficiaryOrganizationSchema = z.object({
  id: z.string().optional(),
  beneficiary_id: z.string().min(1, 'Beneficiary is required'),
  organization_id: z.string().min(1, 'Organization is required'),
  available_points: z.coerce.number().int().min(0).default(0),
  total_points_earned: z.coerce.number().int().min(0).default(0),
  total_points_redeemed: z.coerce.number().int().min(0).default(0),
  joined_date: z.string().optional(),
  is_active: z
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

export type BeneficiaryOrganizationInput = z.input<typeof BeneficiaryOrganizationSchema>;
export type BeneficiaryOrganization = z.infer<typeof BeneficiaryOrganizationSchema>;
