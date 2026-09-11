import { renderHook } from '@testing-library/react';
import { useTranslations } from 'next-intl';
import { z } from 'zod';

import {
  useErrorMessage,
  useFieldErrors,
  useValidationState,
} from '@/lib/use-validation-state';

// El stub global de next-intl devuelve la clave tal cual, asi que estas
// aserciones miran la CLAVE que elige el mapeo, no el texto traducido.
const schema = z.object({ name: z.string().min(1, 'nameRequired') });

const zodErrorFor = (input: unknown) => {
  const parsed = schema.safeParse(input);
  if (parsed.success) throw new Error('expected the schema to reject this input');
  return parsed.error;
};

describe('useValidationState', () => {
  it('convierte un ZodError en fieldErrors traducidos', () => {
    const { result } = renderHook(() => useValidationState());
    const state = result.current(zodErrorFor({ name: '' }));
    expect(state).toEqual({
      status: 'error',
      message: '',
      fieldErrors: { name: ['nameRequired'] },
    });
  });

  it('cae al mensaje generico para cualquier otro error', () => {
    const { result } = renderHook(() => useValidationState());
    expect(result.current(new Error('boom'))).toEqual({
      status: 'error',
      message: 'unexpected',
      fieldErrors: {},
    });
  });
});

describe('useErrorMessage', () => {
  it('mapea un error de Supabase por su code', () => {
    const { result } = renderHook(() => useErrorMessage());
    expect(result.current({ code: '23505', message: 'duplicate key value...' })).toBe(
      'db.duplicate',
    );
  });
});

describe('useFieldErrors', () => {
  it('traduce el mensaje cuando es una clave conocida', () => {
    const { result } = renderHook(() => useFieldErrors());
    expect(result.current(zodErrorFor({ name: '' }))).toEqual({ name: 'nameRequired' });
  });

  it('deja pasar el texto cuando la clave no existe', () => {
    (useTranslations as jest.Mock).mockReturnValueOnce(
      Object.assign((key: string) => `es:${key}`, { has: () => false }),
    );
    const { result } = renderHook(() => useFieldErrors());
    expect(result.current(zodErrorFor({ name: '' }))).toEqual({ name: 'nameRequired' });
  });
});
