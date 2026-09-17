let mockAdminFrom: jest.Mock;

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(() => ({ from: (...a: any[]) => mockAdminFrom(...a) })),
}));

const mockPush = jest.fn(async () => ({ sent: 2, failed: 0 }));
jest.mock('@/lib/push', () => ({
  pushToBeneficiary: (...a: any[]) => mockPush(...(a as [])),
}));

import { notifyRedemptionResolved } from '@/lib/notify-redemption';

// El canje que devuelve la base. `select().eq().single()`.
function withRedemption(data: any) {
  const chain: any = {};
  chain.eq = jest.fn(() => chain);
  chain.single = jest.fn(() => Promise.resolve({ data, error: null }));
  mockAdminFrom = jest.fn(() => ({ select: jest.fn(() => chain) }));
}

const row = (overrides: Record<string, any> = {}) => ({
  id: 7,
  beneficiary_id: 9,
  organization_id: 3,
  points_used: 1500,
  status: 'delivered',
  product: { name: 'Café' },
  organization: { name: 'Churrico' },
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockPush.mockResolvedValue({ sent: 2, failed: 0 });
});

describe('notifyRedemptionResolved', () => {
  it('avisa la entrega con el producto y los puntos usados', async () => {
    withRedemption(row());
    const result = await notifyRedemptionResolved(7);

    expect(result).toEqual({ sent: 2, failed: 0 });
    expect(mockPush).toHaveBeenCalledWith(9, {
      title: 'Retiraste Café en Churrico',
      body: 'Ya te entregamos Café. Usaste 1.500 puntos.',
      data: { type: 'redemption', status: 'delivered', organizationId: 3, redemptionId: 7 },
    });
  });

  it('avisa la cancelacion diciendo que los puntos volvieron', async () => {
    withRedemption(row({ status: 'cancelled' }));
    await notifyRedemptionResolved(7);

    const [, message] = mockPush.mock.calls[0] as any;
    expect(message.title).toBe('Se canceló tu canje en Churrico');
    expect(message.body).toBe('Cancelamos el canje de Café y te devolvimos 1.500 puntos.');
  });

  // PostgREST devuelve el embed como objeto o como array segun la cardinalidad.
  it('acepta el embed como array y cubre los nombres que faltan', async () => {
    withRedemption(row({ product: [], organization: [{ name: 'Churrico' }], points_used: null }));
    await notifyRedemptionResolved(7);

    const [, message] = mockPush.mock.calls[0] as any;
    expect(message.title).toBe('Retiraste tu premio en Churrico');
    expect(message.body).toBe('Ya te entregamos tu premio. Usaste 0 puntos.');
  });

  it('sin producto ni organizacion usa los textos por defecto', async () => {
    withRedemption(row({ product: null, organization: null }));
    await notifyRedemptionResolved(7);

    const [, message] = mockPush.mock.calls[0] as any;
    expect(message.title).toBe('Retiraste tu premio en la tienda');
  });

  it('no avisa un canje que no existe', async () => {
    withRedemption(null);
    expect(await notifyRedemptionResolved(7)).toBeNull();
    expect(mockPush).not.toHaveBeenCalled();
  });

  // El aviso se dispara despues de la RPC: si el canje sigue pendiente, la RPC
  // no hizo nada y no hay nada que contar.
  it('no avisa un canje que sigue pendiente', async () => {
    withRedemption(row({ status: 'pending' }));
    expect(await notifyRedemptionResolved(7)).toBeNull();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
