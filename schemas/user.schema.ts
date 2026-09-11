import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().optional(),
  organization_id: z.string().min(1, 'organizationRequired'),
  first_name: z.string().min(1, 'firstNameRequired'),
  last_name: z.string().min(1, 'lastNameRequired'),
  email: z.email('emailInvalid').min(1, 'emailRequired'),
  password: z.string().min(6, 'passwordMinLength6').optional().or(z.literal('')).transform(val => val === '' ? null : val),
  phone: z.string().optional().or(z.literal('')).transform(val => val === '' ? null : val),
  document_id: z.string().optional().or(z.literal('')).transform(val => val === '' ? null : val),
  active: z.union([z.boolean(), z.string()]).transform(val => {
    if (typeof val === 'boolean') return val;
    return val === 'true' || val === 'on';
  }),
  role_id: z.string().min(1, 'roleRequired'),
  user_type: z.enum(['app_user', 'beneficiary']),
}).refine((data) => {
  // Password is required for new app_users (when id is not present)
  if (data.user_type === 'app_user' && !data.id && !data.password) {
    return false;
  }
  return true;
}, {
  message: 'passwordRequiredNewUser',
  path: ['password'],
});

