const mockGetUser = jest.fn();
let mockUserFrom: jest.Mock;

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: (...a: any[]) => mockUserFrom(...a),
  })),
}));

const mockNotify = jest.fn(async () => ({ sent: 1, failed: 0 }));
jest.mock('@/lib/notify-redemption', () => ({
  notifyRedemptionResolved: (...a: any[]) => mockNotify(...(a as [])),
}));

import { POST } from '@/app/api/redemption/notify/route';

// app_user primero, redemption despues: las dos consultas son
// select().eq()...single() sobre el mismo mock.
function setupUser(results: any[]) {
  const queue = [...results];
  mockUserFrom = jest.fn(() => {
    const chain: any = {};
    chain.eq = jest.fn(() => chain);
    chain.single = jest.fn(() => Promise.resolve(queue.shift() ?? { data: null, error: null }));
    return { select: jest.fn(() => chain) };
  });
}

const CASHIER = { data: { id: 1, organization_id: 5, role: [{ name: 'cashier' }] }, error: null };
const REDEMPTION = { data: { id: 7 }, error: null };

const makeRequest = (
  body: any = { redemptionId: 7 },
  authHeader: string | null = 'Bearer valid-token',
) => ({
  json: () => Promise.resolve(body),
  headers: { get: (name: string) => (name === 'authorization' ? authHeader : null) },
}) as any;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'anon-key';
  mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
  mockNotify.mockResolvedValue({ sent: 1, failed: 0 });
  setupUser([CASHIER, REDEMPTION]);
});

describe('Redemption Notify API Route', () => {
  it('avisa el canje del cajero autenticado', async () => {
    const response = await POST(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true, push: { sent: 1, failed: 0 } });
    expect(mockNotify).toHaveBeenCalledWith(7);
  });

  it('401 sin header de autorizacion', async () => {
    const response = await POST(makeRequest({ redemptionId: 7 }, null));
    expect(response.status).toBe(401);
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it('401 cuando el token no resuelve a un usuario', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'bad jwt' } });
    expect((await POST(makeRequest())).status).toBe(401);
  });

  it('403 cuando el usuario no tiene organizacion', async () => {
    setupUser([{ data: { id: 1, organization_id: null }, error: null }]);
    expect((await POST(makeRequest())).status).toBe(403);
  });

  it('403 cuando el rol no puede entregar', async () => {
    setupUser([{ data: { id: 1, organization_id: 5, role: { name: 'beneficiary' } }, error: null }]);
    expect((await POST(makeRequest())).status).toBe(403);
  });

  it('403 cuando el app_user no tiene rol', async () => {
    setupUser([{ data: { id: 1, organization_id: 5, role: null }, error: null }]);
    expect((await POST(makeRequest())).status).toBe(403);
  });

  it('400 sin redemptionId', async () => {
    expect((await POST(makeRequest({}))).status).toBe(400);
  });

  // El canje de otra organizacion no se ve con el token del cajero: sin esto
  // cualquier cajero podria disparar avisos ajenos.
  it('403 cuando el canje no es de su organizacion', async () => {
    setupUser([CASHIER, { data: null, error: null }]);
    expect((await POST(makeRequest())).status).toBe(403);
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it('404 cuando el canje no quedo en un estado que se avise', async () => {
    mockNotify.mockResolvedValue(null as any);
    expect((await POST(makeRequest())).status).toBe(404);
  });

  it('500 ante un error inesperado', async () => {
    mockNotify.mockRejectedValue(new Error('boom'));
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    expect((await POST(makeRequest())).status).toBe(500);
    spy.mockRestore();
  });
});
