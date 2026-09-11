import type { ZodError } from 'zod';

// Parte de ActionState que tambien corre en el navegador. Vive aparte de
// lib/error-handler.ts porque ese modulo usa next-intl/server, que no existe
// del lado del cliente.
export type ActionState = {
  status: 'success' | 'error' | '';
  message: string;
  fieldErrors: Record<string, string[] | undefined>;
};

export const EMPTY_ACTION_STATE: ActionState = {
  status: '',
  message: '',
  fieldErrors: {},
};

/**
 * Traduce los mensajes de un ZodError (que son claves del namespace
 * `Validation`) con el traductor que le pasen. Lo comparten la validacion del
 * servidor y la del navegador, que obtienen `t` de formas distintas.
 */
export const zodFieldErrors = (
  error: ZodError,
  t: { has: (key: string) => boolean; (key: string): string },
): ActionState['fieldErrors'] => {
  const out: ActionState['fieldErrors'] = {};
  for (const [field, messages] of Object.entries(error.flatten().fieldErrors)) {
    out[field] = (messages as string[] | undefined)?.map((message) =>
      t.has(message) ? t(message) : message,
    );
  }
  return out;
};

/**
 * Strip the numeric prefix added by React's useActionState
 * (e.g., "1_order_number" -> "order_number", pure index keys like "0" are skipped)
 */
export const cleanFormData = (formData: FormData): Record<string, FormDataEntryValue> => {
  const raw = Object.fromEntries(formData);
  const cleaned: Record<string, FormDataEntryValue> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key.match(/^\d+$/)) continue;
    const cleanKey = key.match(/^\d+_/) ? key.substring(key.indexOf('_') + 1) : key;
    if (cleanKey) cleaned[cleanKey] = value;
  }
  return cleaned;
};
