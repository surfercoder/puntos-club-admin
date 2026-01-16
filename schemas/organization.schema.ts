import { z } from 'zod';

export const OrganizationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  business_name: z.string().nullable().optional(),
  tax_id: z.string().nullable().optional(),
  logo_url: z.string().nullable().optional(),
  creation_date: z.string().optional(), // Accept ISO string, default handled by DB
});

export type OrganizationInput = z.input<typeof OrganizationSchema>;
export type Organization = z.infer<typeof OrganizationSchema>;
