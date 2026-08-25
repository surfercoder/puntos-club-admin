import { z } from 'zod';

// Un campo numérico vacío es "no informado", no un error: el superRefine de
// abajo decide si hacía falta según el modo de la operación.
const nonNegativeNumber = (message: string) =>
  z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z
      .union([z.number(), z.string()])
      // El error se reporta como issue de Zod y no con `throw`: un throw acá
      // sale por fuera de safeParse y le explota al server action en la cara en
      // vez de volver como fieldError del importe.
      .transform((val, ctx) => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        if (Number.isNaN(num) || num < 0) {
          ctx.addIssue({ code: 'custom', message });
          return z.NEVER;
        }
        return num;
      })
      .optional(),
  );

export const PurchaseSchema = z
  .object({
    id: z.string().optional(),
    // "sale" cobra un importe y el motor calcula los puntos; "assignment" otorga
    // puntos a mano, sin importe. La lista deriva el tipo del importe.
    mode: z.enum(['sale', 'assignment']).default('sale'),
    beneficiary_id: z.string().min(1, 'Beneficiary is required'),
    // cashier_id is not accepted from the client: the owner is always the virtual
    // cashier, injected server-side. Keeps an owner from impersonating a cashier.
    branch_id: z.string().optional().nullable().transform(val => val === '' ? null : val),
    total_amount: nonNegativeNumber('Amount must be a non-negative number'),
    points_earned: nonNegativeNumber('Points must be a non-negative number'),
    notes: z.string().optional().nullable().transform(val => val === '' ? null : val),
  })
  .superRefine((data, ctx) => {
    if (data.mode === 'sale' && data.total_amount === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['total_amount'],
        message: 'Amount is required',
      });
    }
    if (data.mode === 'assignment' && data.points_earned === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['points_earned'],
        message: 'Points are required',
      });
    }
  });
