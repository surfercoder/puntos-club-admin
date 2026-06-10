jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn(() => ({ value: '123' })), set: jest.fn() })),
}));

jest.mock('@/actions/dashboard/redemption/actions', () => ({
  createRedemption: jest.fn(() => ({ data: { id: '1' }, error: null })),
  updateRedemption: jest.fn(() => ({ data: { id: '1' }, error: null })),
}));

import { revalidatePath } from 'next/cache';
import { redemptionFormAction } from '@/actions/dashboard/redemption/redemption-form-actions';
import { createRedemption, updateRedemption } from '@/actions/dashboard/redemption/actions';
import { EMPTY_ACTION_STATE } from '@/lib/error-handler';

beforeEach(() => {
  jest.clearAllMocks();
});

function createFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) fd.append(k, v);
  return fd;
}

describe('redemptionFormAction', () => {
  it('should create redemption successfully', async () => {
    const fd = createFormData({ beneficiary_id: '1', product_id: 'prod-1', points_used: '100' });
    const result = await redemptionFormAction(EMPTY_ACTION_STATE, fd);
    expect(createRedemption).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/redemption');
    expect(result.status).toBe('success');
  });

  it('should update redemption successfully', async () => {
    const fd = createFormData({ id: '1', beneficiary_id: '1', product_id: 'prod-1', points_used: '100' });
    const result = await redemptionFormAction(EMPTY_ACTION_STATE, fd);
    expect(updateRedemption).toHaveBeenCalled();
    expect(result.status).toBe('success');
  });

  it('should return validation error', async () => {
    const fd = createFormData({ beneficiary_id: '' });
    const result = await redemptionFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });

  it('should handle thrown error', async () => {
    (createRedemption as jest.Mock).mockImplementation(() => { throw new Error('Error'); });
    const fd = createFormData({ beneficiary_id: '1', product_id: 'prod-1', points_used: '100' });
    const result = await redemptionFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });

  describe('createRedemption error mapping', () => {
    const cases: Array<[string, string]> = [
      ['PENDING_REDEMPTION_EXISTS', 'El beneficiario ya tiene un canje pendiente. Debe completarlo o cancelarlo antes de pedir otro.'],
      ['INSUFFICIENT_POINTS', 'Puntos insuficientes.'],
      ['OUT_OF_STOCK', 'El producto no tiene stock disponible.'],
      ['MEMBERSHIP_NOT_FOUND', 'El beneficiario no pertenece a esta organización.'],
      ['MEMBERSHIP_INACTIVE', 'La membresía del beneficiario está inactiva.'],
      ['PRODUCT_NOT_FOUND', 'Producto no encontrado en esta organización.'],
      ['SOMETHING_UNKNOWN', 'Ocurrió un error al procesar el canje.'],
    ];

    it.each(cases)('maps rpc error %s to Spanish message', async (code, expected) => {
      (createRedemption as jest.Mock).mockResolvedValueOnce({ data: null, error: { message: code } });
      const fd = createFormData({ beneficiary_id: '1', product_id: 'prod-1', points_used: '100' });
      const result = await redemptionFormAction(EMPTY_ACTION_STATE, fd);
      expect(result.status).toBe('error');
      expect(result.message).toBe(expected);
    });
  });
});
