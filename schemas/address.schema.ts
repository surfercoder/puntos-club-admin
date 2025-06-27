import { z } from 'zod';

export const AddressSchema = z.object({
  city: z.string().min(1, 'City is required'),
  id: z.string().optional(),
  number: z.string().min(1, 'Number is required'),
  state: z.string().min(1, 'State is required'),
  street: z.string().min(1, 'Street is required'),
  zip_code: z.string().min(1, 'Zip code is required'),
});

export type AddressInput = z.input<typeof AddressSchema>;
export type Address = z.infer<typeof AddressSchema>;
