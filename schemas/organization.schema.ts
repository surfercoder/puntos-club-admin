import { z } from 'zod';

export const OrganizationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  business_name: z.string().nullable().optional(),
  tax_id: z.string().nullable().optional(),
  public_info: z.string().nullable().optional(),
  logo_url: z.string().nullable().optional(),
  creation_date: z.string().optional(), // Accept ISO string, default handled by DB
  is_public: z.boolean().optional(),
});

export const OrganizationVisibilitySchema = z.object({
  is_public: z.boolean(),
});


/** Dirección principal del club; sólo estos campos llegan a la tabla address. */
export const ClubProfileAddressSchema = z.object({
  street: z.string(),
  number: z.string(),
  city: z.string(),
  state: z.string(),
  zip_code: z.string(),
  country: z.string().nullable(),
  place_id: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
});

/**
 * Campos del "Perfil del Club" que el owner puede editar.
 *
 * Es una allowlist a propósito: la acción escribe sobre su propia organización,
 * así que RLS no la frena, y sin este filtro un `plan: 'pro'` colado en el
 * payload se guardaría igual.
 */
export const ClubProfileSchema = z.object({
  name: z.string().min(1),
  business_name: z.string().nullable(),
  tax_id: z.string().nullable(),
  description: z.string().nullable(),
  contact_email: z.string().nullable(),
  contact_phone: z.string().nullable(),
  website: z.string().nullable(),
  industry: z.string().nullable(),
  logo_url: z.string().nullable(),
  is_public: z.boolean(),
  show_in_explore: z.boolean(),
  allow_new_members: z.boolean(),
  requires_approval: z.boolean(),
  email_notifications: z.boolean(),
  invitation_code: z.string().nullable(),
  welcome_message: z.string().nullable(),
  points_label: z.string(),
  timezone: z.string().nullable(),
  address: ClubProfileAddressSchema.optional(),
});
