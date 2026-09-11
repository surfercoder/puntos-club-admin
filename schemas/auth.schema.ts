import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().min(1, 'emailRequired').email('emailInvalid'),
  password: z.string().min(1, 'passwordRequired'),
});

export const ProfileSchema = z.object({
  first_name: z.string().min(1, 'firstNameRequired'),
  last_name: z.string().min(1, 'lastNameRequired'),
  email: z.string().min(1, 'emailRequired').email('emailInvalid'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().min(1, 'emailRequired').email('emailInvalid'),
});

export const UpdatePasswordSchema = z.object({
  password: z.string().min(8, 'passwordMinLength'),
});

