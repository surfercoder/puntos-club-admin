import { z } from 'zod';

export const AppUserOrganizationSchema = z.object({
  id: z.string().optional(),
  app_user_id: z.string().min(1, 'User is required'),
  organization_id: z.string().min(1, 'Organization is required'),
  is_active: z
    .union([z.boolean(), z.string()])
    .transform((val) => {
      if (typeof val === 'boolean') return val;
      return val === 'true' || val === 'on';
    })
    .default(true),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type AppUserOrganizationInput = z.input<typeof AppUserOrganizationSchema>;
export type AppUserOrganization = z.infer<typeof AppUserOrganizationSchema>;
