import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().optional(),
  organization_id: z.string().min(1, 'Organization is required'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  username: z.string().min(3, 'Username must be at least 3 characters').optional().or(z.literal('')).transform(val => val === '' ? null : val),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')).transform(val => val === '' ? null : val),
  phone: z.string().optional().or(z.literal('')).transform(val => val === '' ? null : val),
  document_id: z.string().optional().or(z.literal('')).transform(val => val === '' ? null : val),
  active: z.union([z.boolean(), z.string()]).transform(val => {
    if (typeof val === 'boolean') return val;
    return val === 'true' || val === 'on';
  }),
  role_id: z.string().min(1, 'Role is required'),
  user_type: z.enum(['app_user', 'beneficiary']),
}).refine((data) => {
  // Password is required for new app_users (when id is not present)
  if (data.user_type === 'app_user' && !data.id && !data.password) {
    return false;
  }
  return true;
}, {
  message: 'Password is required for new users',
  path: ['password'],
});

export type UserInput = z.input<typeof UserSchema>;
export type User = z.infer<typeof UserSchema>;
