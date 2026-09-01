import { z } from 'zod';

import { allRulesPass } from '@/components/onboarding/password-rules';

export const AppUserSchema = z.object({
  id: z.string().optional(),
  first_name: z.string().trim().min(1, 'El nombre es requerido'),
  last_name: z.string().trim().min(1, 'El apellido es requerido'),
  email: z.string().trim().min(1, 'El correo electrónico es requerido').email('Dirección de correo inválida'),
  password: z.string().optional().transform(val => val || undefined),
  role_id: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
  // Al crear, la contraseña es obligatoria: sin ella no se crea el usuario de
  // Auth y el cajero no puede entrar a la app. Al editar (viene `id`), vacía
  // significa "no la cambies".
  if (!data.id && !data.password) {
    ctx.addIssue({ code: 'custom', path: ['password'], message: 'La contraseña es requerida' });
  }
  if (data.password && !allRulesPass(data.password)) {
    ctx.addIssue({
      code: 'custom',
      path: ['password'],
      message: 'La contraseña debe tener 8 caracteres, mayúscula, minúscula, número y símbolo',
    });
  }
});

export type AppUserInput = z.output<typeof AppUserSchema>;
