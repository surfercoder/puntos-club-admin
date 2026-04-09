import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().min(1, 'El correo electrónico es requerido').email('Dirección de correo inválida'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const ProfileSchema = z.object({
  first_name: z.string().min(1, 'El nombre es requerido'),
  last_name: z.string().min(1, 'El apellido es requerido'),
  email: z.string().min(1, 'El correo electrónico es requerido').email('Dirección de correo inválida'),
  username: z.string().optional().or(z.literal('')),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().min(1, 'El correo electrónico es requerido').email('Dirección de correo inválida'),
});

export const UpdatePasswordSchema = z.object({
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

