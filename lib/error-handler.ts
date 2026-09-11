import { getTranslations } from 'next-intl/server';
import { ZodError } from 'zod';

import { zodFieldErrors, type ActionState } from '@/lib/action-state';
import { AppError, errorDescriptor, type ErrorKey } from '@/lib/errors';

export type { ActionState } from '@/lib/action-state';
export { EMPTY_ACTION_STATE, cleanFormData } from '@/lib/action-state';

/**
 * Traduce un error de servidor al idioma del usuario.
 *
 * Los server actions corren dentro del request, asi que `getTranslations` lee
 * la cookie NEXT_LOCALE igual que el resto de la app. Traducir aca (y no en el
 * cliente) mantiene `ActionState.message` como texto listo para mostrar, que es
 * lo que ya esperan los formularios y los toast-handler.
 */
export const translateError = async (error: unknown): Promise<string> => {
  const t = await getTranslations('Errors');
  const { key, params } = errorDescriptor(error);
  return t(key, params);
};

/**
 * Texto ya traducido de una clave de `Errors`. Atajo para los ~140 sitios que
 * devuelven el mensaje como string suelto (rutas de API y acciones con
 * `{ success, error }`), en vez de repetir `translateError(new AppError(k))`.
 * Las capas de datos NO usan esto: transportan el `AppError` y traduce arriba.
 */
export const errorText = (key: ErrorKey): Promise<string> =>
  translateError(new AppError(key));

export const fromErrorToActionState = async (
  error: unknown,
): Promise<ActionState> => {
  if (error instanceof ZodError) {
    const t = await getTranslations('Validation');
    return { status: 'error', message: '', fieldErrors: zodFieldErrors(error, t) };
  }

  // Supabase devuelve PostgrestError como objeto plano, no como Error, asi que
  // errorDescriptor mira `code`/`message` en vez de usar instanceof.
  return {
    status: 'error',
    message: await translateError(error),
    fieldErrors: {},
  };
};

/**
 * `key` es una clave del namespace `Actions` de messages/{es,en}.json
 * ("branchUpdated", "productCreated", ...). Se traduce aca para que ningun
 * literal en ingles llegue a un toast.
 */
export const toActionState = async (key: string): Promise<ActionState> => {
  const t = await getTranslations('Actions');
  return {
    status: 'success',
    message: t(key),
    fieldErrors: {},
  };
};

/** Igual que `toActionState` pero devuelve solo el texto, para los redirect
 *  que mandan el mensaje por `?success=`. */
export const actionMessage = async (key: string): Promise<string> => {
  const t = await getTranslations('Actions');
  return t(key);
};
