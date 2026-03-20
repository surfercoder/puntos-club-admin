import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().min(1),
  // Registration flow — required for custom email verification
  REGISTRATION_SECRET: z.string().min(16).optional(),
  // MercadoPago — subscription billing
  MERCADOPAGO_ACCESS_TOKEN: z.string().min(1).optional(),
  MP_PLAN_ID_ADVANCE: z.string().min(1).optional(),
  MP_PLAN_ID_PRO: z.string().min(1).optional(),
  MP_WEBHOOK_SECRET: z.string().min(1).optional(),
})

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  REGISTRATION_SECRET: process.env.REGISTRATION_SECRET,
  MERCADOPAGO_ACCESS_TOKEN: process.env.MERCADOPAGO_ACCESS_TOKEN,
  MP_PLAN_ID_ADVANCE: process.env.MP_PLAN_ID_ADVANCE,
  MP_PLAN_ID_PRO: process.env.MP_PLAN_ID_PRO,
  MP_WEBHOOK_SECRET: process.env.MP_WEBHOOK_SECRET,
})
