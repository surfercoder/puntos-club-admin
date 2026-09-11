import { z } from 'zod';

export const AddressSchema = z.object({
  city: z.string().min(1, 'cityRequired'),
  id: z.string().optional(),
  number: z.string().min(1, 'numberRequired'),
  organization_id: z.string().optional(),
  state: z.string().min(1, 'stateRequired'),
  street: z.string().min(1, 'streetRequired'),
  zip_code: z.string().min(1, 'zipRequired'),
  country: z.string().optional(),
  place_id: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

