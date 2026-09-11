'use client';

import { useTranslations } from 'next-intl';
import { ZodError } from 'zod';

import { zodFieldErrors, type ActionState } from '@/lib/action-state';
import { errorDescriptor } from '@/lib/errors';

/**
 * Contraparte de `fromErrorToActionState` para la validacion que corre en el
 * navegador (los formularios hacen `Schema.parse` antes de enviar). El servidor
 * traduce con `getTranslations`, que en el cliente no existe.
 */
export function useValidationState() {
  const tValidation = useTranslations('Validation');
  const tErrors = useTranslations('Errors');

  return (error: unknown): ActionState => {
    if (error instanceof ZodError) {
      return {
        status: 'error',
        message: '',
        fieldErrors: zodFieldErrors(error, tValidation),
      };
    }
    return { status: 'error', message: tErrors('unexpected'), fieldErrors: {} };
  };
}

/**
 * Traduce cualquier error de servidor que llegue al cliente (llamadas directas
 * a Supabase desde el navegador). Misma tabla que el servidor: se mapea por
 * `code`, nunca se muestra el texto crudo de GoTrue/PostgREST.
 */
export function useErrorMessage() {
  const t = useTranslations('Errors');
  return (error: unknown): string => {
    const { key, params } = errorDescriptor(error);
    return t(key, params);
  };
}

/**
 * Los mensajes de los schemas son claves del namespace `Validation`; esto los
 * convierte en el `{ campo: texto }` que usan los formularios de auth y perfil.
 */
export function useFieldErrors() {
  const t = useTranslations('Validation');
  return (error: ZodError): Record<string, string> => {
    const errors: Record<string, string> = {};
    for (const issue of error.issues) {
      const field = String(issue.path[0]);
      if (!errors[field]) {
        errors[field] = t.has(issue.message) ? t(issue.message) : issue.message;
      }
    }
    return errors;
  };
}
