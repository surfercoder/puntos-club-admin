import { z } from 'zod';

// Exported individually so the component can use them for per-field validation
// without relying on ZodObject.shape (API changed in Zod v4)
export const contactFieldSchemas = {
  firstName: z
    .string()
    .min(1, 'validation.firstNameRequired')
    .min(2, 'validation.firstNameMinLength'),
  lastName: z
    .string()
    .min(1, 'validation.lastNameRequired')
    .min(2, 'validation.lastNameMinLength'),
  email: z
    .string()
    .min(1, 'validation.emailRequired')
    .email('validation.emailInvalid'),
  phoneNumber: z
    .string()
    .min(1, 'validation.phoneRequired')
    .regex(/^[^a-zA-Z]*$/, 'validation.phoneNoLetters')
    .min(10, 'validation.phoneMinLength'),
  message: z
    .string()
    .min(1, 'validation.messageRequired')
    .min(50, 'validation.messageMinLength'),
} as const;

export const ContactSchema = z.object({
  ...contactFieldSchemas,
  business: z.string().optional(), // company name is optional, no validation
});

export type ContactFormData = z.infer<typeof ContactSchema>;

export type ContactFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  business: string;
  message: string;
  honeyField: string;
};
