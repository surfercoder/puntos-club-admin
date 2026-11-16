import { z } from 'zod';

// Exported individually so the component can use them for per-field validation
// without relying on ZodObject.shape (API changed in Zod v4)
export const contactFieldSchemas = {
  name: z
    .string()
    .trim()
    .min(1, 'validation.nameRequired')
    .min(2, 'validation.nameMinLength'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'validation.emailRequired')
    .email('validation.emailInvalid'),
  // Opcional en el mockup: vacío pasa, pero si lo completan tiene que parecer un teléfono.
  phoneNumber: z
    .string()
    .regex(/^[^a-zA-Z]*$/, 'validation.phoneNoLetters')
    .refine((v) => v === '' || v.length >= 10, 'validation.phoneMinLength'),
  message: z
    .string()
    .trim()
    .min(1, 'validation.messageRequired')
    .min(10, 'validation.messageMinLength'),
} as const;

export const ContactSchema = z.object({
  ...contactFieldSchemas,
  phoneNumber: contactFieldSchemas.phoneNumber.optional(),
  business: z.string().optional(), // company name is optional, no validation
});

export type ContactFormData = z.infer<typeof ContactSchema>;

export type ContactFormValues = {
  name: string;
  email: string;
  phoneNumber: string;
  business: string;
  message: string;
  honeyField: string;
};
