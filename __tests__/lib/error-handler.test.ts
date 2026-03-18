import { type ZodError, z } from 'zod';
import {
  EMPTY_ACTION_STATE,
  fromErrorToActionState,
  toActionState,
  cleanFormData,
} from '@/lib/error-handler';

describe('EMPTY_ACTION_STATE', () => {
  it('has empty status, empty message, and empty fieldErrors', () => {
    expect(EMPTY_ACTION_STATE).toEqual({
      status: '',
      message: '',
      fieldErrors: {},
    });
  });
});

describe('fromErrorToActionState', () => {
  it('handles ZodError with field errors', () => {
    const schema = z.object({
      name: z.string().min(1, 'Name is required'),
      email: z.string().email('Invalid email'),
    });

    let zodError: ZodError;
    try {
      schema.parse({ name: '', email: 'bad' });
    } catch (e) {
      zodError = e as ZodError;
    }

    const result = fromErrorToActionState(zodError!);
    expect(result.status).toBe('error');
    expect(result.message).toBe('');
    expect(result.fieldErrors).toBeDefined();
    expect(result.fieldErrors.name).toBeDefined();
    expect(result.fieldErrors.email).toBeDefined();
  });

  it('handles regular Error', () => {
    const error = new Error('Something went wrong');
    const result = fromErrorToActionState(error);
    expect(result).toEqual({
      status: 'error',
      message: 'Something went wrong',
      fieldErrors: {},
    });
  });

  it('handles unknown error (string)', () => {
    const result = fromErrorToActionState('random string');
    expect(result).toEqual({
      status: 'error',
      message: 'An unknown error occurred',
      fieldErrors: {},
    });
  });

  it('handles unknown error (number)', () => {
    const result = fromErrorToActionState(42);
    expect(result).toEqual({
      status: 'error',
      message: 'An unknown error occurred',
      fieldErrors: {},
    });
  });

  it('handles null', () => {
    const result = fromErrorToActionState(null);
    expect(result).toEqual({
      status: 'error',
      message: 'An unknown error occurred',
      fieldErrors: {},
    });
  });

  it('handles undefined', () => {
    const result = fromErrorToActionState(undefined);
    expect(result).toEqual({
      status: 'error',
      message: 'An unknown error occurred',
      fieldErrors: {},
    });
  });
});

describe('toActionState', () => {
  it('returns success state with given message', () => {
    expect(toActionState('Created successfully')).toEqual({
      status: 'success',
      message: 'Created successfully',
      fieldErrors: {},
    });
  });

  it('handles empty message', () => {
    expect(toActionState('')).toEqual({
      status: 'success',
      message: '',
      fieldErrors: {},
    });
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
