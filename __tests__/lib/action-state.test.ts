import { z } from 'zod';

import { zodFieldErrors } from '@/lib/action-state';

// `t` puede no tener la clave: pasa si un schema trae texto suelto en vez de
// una clave de `Validation`. En ese caso el texto se muestra tal cual, en vez
// de romper el formulario con el error de clave faltante de next-intl.
const translator = (known: string[]) =>
  Object.assign((key: string) => `es:${key}`, {
    has: (key: string) => known.includes(key),
  });

describe('zodFieldErrors', () => {
  const schema = z.object({
    name: z.string().min(1, 'nameRequired'),
    email: z.string().min(1, 'Free-form message'),
  });

  const errorFor = (input: unknown) => {
    const parsed = schema.safeParse(input);
    if (parsed.success) throw new Error('expected the schema to reject this input');
    return parsed.error;
  };

  it('traduce los mensajes que son claves de Validation', () => {
    const result = zodFieldErrors(errorFor({ name: '', email: 'a' }), translator(['nameRequired']));
    expect(result.name).toEqual(['es:nameRequired']);
  });

  it('deja pasar el texto cuando no es una clave conocida', () => {
    const result = zodFieldErrors(errorFor({ name: 'a', email: '' }), translator(['nameRequired']));
    expect(result.email).toEqual(['Free-form message']);
  });
});
