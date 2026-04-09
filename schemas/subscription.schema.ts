import { z } from 'zod';

export const SubscriptionSchema = z.object({
  id: z.string().optional(),
  organization_id: z.string().min(1, 'Organization is required'),
  mp_preapproval_id: z.string().min(1, 'MercadoPago preapproval ID is required'),
  mp_plan_id: z.string().min(1, 'MercadoPago plan ID is required'),
  plan: z.enum(['advance', 'pro']),
  status: z.enum(['pending', 'authorized', 'paused', 'cancelled']).default('pending'),
  payer_email: z.string().email('Valid email is required'),
  amount: z.union([z.number(), z.string()]).transform(val => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) throw new Error('Amount must be a number');
    return num;
  }),
  currency: z.string().default('ARS'),
});

