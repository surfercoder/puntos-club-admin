import { type ZodError, z } from 'zod';
import {
  EMPTY_ACTION_STATE,
  actionMessage,
  fromErrorToActionState,
  toActionState,
  translateError,
  cleanFormData,
} from '@/lib/error-handler';
import { AppError } from '@/lib/errors';

describe('EMPTY_ACTION_STATE', () => {
  it('has empty status, empty message, and empty fieldErrors', () => {
    expect(EMPTY_ACTION_STATE).toEqual({
      status: '',
      message: '',
      fieldErrors: {},
    });
  });
});

// El mock de next-intl devuelve la clave tal cual (ver jest.setup.js), asi que
// las aserciones miran la CLAVE de i18n que elige el mapeo, no el texto final.
describe('fromErrorToActionState', () => {
  it('handles ZodError with field errors', async () => {
    const schema = z.object({
      name: z.string().min(1, 'nameRequired'),
      email: z.string().email('Invalid email'),
    });

    let zodError: ZodError;
    try {
      schema.parse({ name: '', email: 'bad' });
    } catch (e) {
      zodError = e as ZodError;
    }

    const result = await fromErrorToActionState(zodError!);
    expect(result.status).toBe('error');
    expect(result.message).toBe('');
    expect(result.fieldErrors).toBeDefined();
    expect(result.fieldErrors.name).toBeDefined();
    expect(result.fieldErrors.email).toBeDefined();
  });

  it('mapea un Error cualquiera al mensaje generico', async () => {
    const result = await fromErrorToActionState(new Error('Something went wrong'));
    expect(result).toEqual({
      status: 'error',
      message: 'unexpected',
      fieldErrors: {},
    });
  });

  // El texto de PostgREST nombra la constraint: nunca se muestra, se mapea por code.
  it('mapea un PostgrestError por su code sin exponer el detalle', async () => {
    const result = await fromErrorToActionState({
      message: 'new row violates check constraint "product_stock_non_negative"',
      code: '23514',
      details: null,
      hint: null,
    });
    expect(result).toEqual({
      status: 'error',
      message: 'db.invalidValue',
      fieldErrors: {},
    });
  });

  it('traduce el rate limit de GoTrue con los segundos que faltan', async () => {
    const result = await fromErrorToActionState({
      message: 'For security purposes, you can only request this after 60 seconds.',
      code: 'over_email_send_rate_limit',
      status: 429,
    });
    expect(result.message).toBe('auth.rateLimitSeconds');
  });

  it('cae al rate limit generico cuando el texto no trae los segundos', async () => {
    const result = await fromErrorToActionState({ status: 429, message: 'slow down' });
    expect(result.message).toBe('auth.rateLimit');
  });

  it('traduce "Email not confirmed", el error del ticket', async () => {
    const result = await fromErrorToActionState({
      message: 'Email not confirmed',
      code: 'email_not_confirmed',
    });
    expect(result.message).toBe('auth.emailNotConfirmed');
  });

  it('reconoce las excepciones RAISE de las funciones de la base', async () => {
    const result = await fromErrorToActionState({
      message: 'DB error: INSUFFICIENT_POINTS for beneficiary 42',
    });
    expect(result.message).toBe('rpc.insufficientPoints');
  });

  it('reconoce la compra cuyos puntos el socio ya gasto', async () => {
    const result = await fromErrorToActionState({
      code: 'P0001',
      message: 'PURCHASE_POINTS_ALREADY_SPENT',
    });
    expect(result.message).toBe('rpc.purchasePointsSpent');
  });

  it('trata un fallo de red como tal', async () => {
    const result = await fromErrorToActionState(new TypeError('Network request failed'));
    expect(result.message).toBe('network');
  });

  it.each([
    'Failed to fetch',
    'NetworkError when attempting to fetch resource.',
    'Load failed',
    'fetch failed',
  ])('reconoce el fallo de fetch de cada navegador: %s', async (message) => {
    const result = await fromErrorToActionState(new TypeError(message));
    expect(result.message).toBe('network');
  });

  // Un bug nuestro tambien levanta TypeError. Si lo contaramos como red, el
  // usuario iria a mirar el WiFi por un null deref y el bug quedaria tapado.
  it('no confunde un TypeError de un bug de codigo con un fallo de red', async () => {
    const result = await fromErrorToActionState(
      new TypeError("Cannot read properties of undefined (reading 'id')"),
    );
    expect(result.message).toBe('unexpected');
  });

  it('deja pasar la clave de un AppError', async () => {
    const result = await fromErrorToActionState(new AppError('branch.createFailed'));
    expect(result.message).toBe('branch.createFailed');
  });

  it('falls back to the generic message for an object with an empty message', async () => {
    const result = await fromErrorToActionState({ message: '' });
    expect(result).toEqual({
      status: 'error',
      message: 'unexpected',
      fieldErrors: {},
    });
  });

  it('falls back to the generic message for an object with a non-string message', async () => {
    const result = await fromErrorToActionState({ message: 500 });
    expect(result).toEqual({
      status: 'error',
      message: 'unexpected',
      fieldErrors: {},
    });
  });

  it('handles unknown error (string)', async () => {
    const result = await fromErrorToActionState('random string');
    expect(result).toEqual({
      status: 'error',
      message: 'unexpected',
      fieldErrors: {},
    });
  });

  it('handles unknown error (number)', async () => {
    const result = await fromErrorToActionState(42);
    expect(result).toEqual({
      status: 'error',
      message: 'unexpected',
      fieldErrors: {},
    });
  });

  it('handles null', async () => {
    const result = await fromErrorToActionState(null);
    expect(result).toEqual({
      status: 'error',
      message: 'unexpected',
      fieldErrors: {},
    });
  });

  it('handles undefined', async () => {
    const result = await fromErrorToActionState(undefined);
    expect(result).toEqual({
      status: 'error',
      message: 'unexpected',
      fieldErrors: {},
    });
  });
});

describe('toActionState', () => {
  it('devuelve el estado de exito con el mensaje traducido de la clave', async () => {
    expect(await toActionState('branchCreated')).toEqual({
      status: 'success',
      message: 'branchCreated',
      fieldErrors: {},
    });
  });

  it('devuelve la clave de actualizacion tal cual la traduce el namespace', async () => {
    expect(await toActionState('branchUpdated')).toEqual({
      status: 'success',
      message: 'branchUpdated',
      fieldErrors: {},
    });
  });
});

describe('actionMessage', () => {
  it('devuelve solo el texto, para los redirect con ?success=', async () => {
    expect(await actionMessage('purchaseCreated')).toBe('purchaseCreated');
  });
});

describe('translateError', () => {
  it('devuelve el texto del error ya traducido', async () => {
    expect(await translateError({ code: '23505' })).toBe('db.duplicate');
  });
});

describe('cleanFormData', () => {
  it('strips numeric prefixes from keys (e.g. "1_name" -> "name")', () => {
    const fd = new FormData();
    fd.append('1_name', 'Alice');
    fd.append('1_email', 'alice@test.com');

    const result = cleanFormData(fd);
    expect(result).toEqual({
      name: 'Alice',
      email: 'alice@test.com',
    });
  });

  it('skips pure numeric index keys (e.g. "0")', () => {
    const fd = new FormData();
    fd.append('0', 'should-be-skipped');
    fd.append('name', 'Alice');

    const result = cleanFormData(fd);
    expect(result).toEqual({
      name: 'Alice',
    });
  });

  it('keeps normal keys unchanged', () => {
    const fd = new FormData();
    fd.append('first_name', 'Bob');
    fd.append('last_name', 'Smith');

    const result = cleanFormData(fd);
    expect(result).toEqual({
      first_name: 'Bob',
      last_name: 'Smith',
    });
  });

  it('handles mixed keys', () => {
    const fd = new FormData();
    fd.append('0', 'skip');
    fd.append('1_order_number', '12345');
    fd.append('regular', 'value');

    const result = cleanFormData(fd);
    expect(result).toEqual({
      order_number: '12345',
      regular: 'value',
    });
  });

  it('handles empty FormData', () => {
    const fd = new FormData();
    const result = cleanFormData(fd);
    expect(result).toEqual({});
  });

  it('handles multi-digit numeric prefix', () => {
    const fd = new FormData();
    fd.append('123_field', 'value');

    const result = cleanFormData(fd);
    expect(result).toEqual({
      field: 'value',
    });
  });

  it('skips multi-digit pure numeric keys', () => {
    const fd = new FormData();
    fd.append('123', 'skip');

    const result = cleanFormData(fd);
    expect(result).toEqual({});
  });

  it('skips key that becomes empty after stripping prefix (e.g. "1_")', () => {
    const fd = new FormData();
    fd.append('1_', 'value');

    const result = cleanFormData(fd);
    // After stripping "1_", cleanKey is "" which is falsy, so it should be skipped
    expect(result).toEqual({});
  });
});
