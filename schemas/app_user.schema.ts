import { z } from 'zod';

import { allRulesPass } from '@/components/onboarding/password-rules';

export const AppUserSchema = z.object({
  id: z.string().optional(),
  first_name: z.string().trim().min(1, 'firstNameRequired'),
  last_name: z.string().trim().min(1, 'lastNameRequired'),
  email: z.string().trim().toLowerCase().min(1, 'emailRequired').email('emailInvalid'),
  password: z.string().optional().transform(val => val || undefined),
  role_id: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
  // Al crear, la contraseña es obligatoria: sin ella no se crea el usuario de
  // Auth y el cajero no puede entrar a la app. Al editar (viene `id`), vacía
  // significa "no la cambies".
  if (!data.id && !data.password) {
    ctx.addIssue({ code: 'custom', path: ['password'], message: 'passwordRequired' });
  }
  if (data.password && !allRulesPass(data.password)) {
    ctx.addIssue({
      code: 'custom',
      path: ['password'],
      message: 'passwordWeak',
    });
  }
});

export type AppUserInput = z.output<typeof AppUserSchema>;
