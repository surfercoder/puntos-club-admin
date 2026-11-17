import type { NextRequest } from 'next/server';

const mockAskClubi = jest.fn();
const mockGetCurrentUser = jest.fn();
const mockHasOwner = jest.fn();
const mockInsert = jest.fn();
let mockCount: number | null = 0;
let mockPlan: string | null = 'pro';

jest.mock('@/lib/ai/clubi', () => ({ askClubi: (...a: unknown[]) => mockAskClubi(...a) }));
jest.mock('@/lib/auth/get-current-user', () => ({ getCurrentUser: () => mockGetCurrentUser() }));
jest.mock('@/lib/plans/usage', () => ({
  getOrganizationUsageSummary: async () => (mockPlan ? { plan: mockPlan, features: [] } : null),
}));
jest.mock('@/lib/auth/roles', () => ({ hasOwnerPermissions: (u: unknown) => mockHasOwner(u) }));
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(async () => ({
    from: () => ({
      select: () => ({ gte: async () => ({ count: mockCount }) }),
      insert: mockInsert,
    }),
  })),
}));

import { POST } from '@/app/api/clubi/route';

const req = (body: unknown) =>
  ({
    json: body instanceof Error ? jest.fn().mockRejectedValue(body) : jest.fn().mockResolvedValue(body),
  }) as unknown as NextRequest;

const ask = (content = 'hola') => req({ messages: [{ role: 'user', content }] });

const owner = { id: 1, organization_id: '7', organization: { name: 'Café' } };

beforeEach(() => {
  jest.clearAllMocks();
  process.env.ANTHROPIC_API_KEY = 'k';
  mockCount = 0;
  mockPlan = 'pro';
  mockGetCurrentUser.mockResolvedValue(owner);
  mockHasOwner.mockReturnValue(true);
  mockAskClubi.mockResolvedValue({ text: 'respuesta', inputTokens: 10, outputTokens: 5 });
});

async function call(r: NextRequest) {
  const res = await POST(r);
  return { status: res.status, data: await res.json() };
}

describe('POST /api/clubi', () => {
  it('401 sin sesión', async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    expect(await call(ask())).toEqual({ status: 401, data: { error: 'auth.notAuthenticated' } });
  });

  it('403 si no es owner/colaborador', async () => {
    mockHasOwner.mockReturnValue(false);
    expect((await call(ask())).status).toBe(403);
  });

  it('403 si no tiene org', async () => {
    mockGetCurrentUser.mockResolvedValue({ ...owner, organization_id: null });
    expect((await call(ask())).status).toBe(403);
  });

  it.each(['trial', 'advance', null])('403 con plan %s', async (plan) => {
    mockPlan = plan;
    expect(await call(ask())).toEqual({ status: 403, data: { error: 'clubi.planNotIncluded' } });
    expect(mockAskClubi).not.toHaveBeenCalled();
  });

  it('enterprise también puede', async () => {
    mockPlan = 'enterprise';
    expect((await call(ask())).status).toBe(200);
  });

  it('503 sin API key', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    expect(await call(ask())).toEqual({ status: 503, data: { error: 'clubi.notConfigured' } });
  });

  it.each([
    ['body ilegible', req(new Error('bad'))],
    ['último turno del asistente', req({ messages: [{ role: 'assistant', content: 'x' }] })],
    ['pregunta de más de 500', ask('a'.repeat(501))],
    ['sin mensajes', req({ messages: [] })],
    ['mensajes que no son lista', req({ messages: 'hola' })],
  ])('400 con %s', async (_name, r) => {
    expect(await call(r)).toEqual({ status: 400, data: { error: 'clubi.invalidMessage' } });
  });

  it('429 al llegar al tope diario', async () => {
    mockCount = 40;
    expect(await call(ask())).toEqual({ status: 429, data: { error: 'clubi.dailyLimit' } });
    expect(mockAskClubi).not.toHaveBeenCalled();
  });

  it('responde y registra los tokens', async () => {
    expect(await call(ask())).toEqual({ status: 200, data: { reply: 'respuesta' } });
    expect(mockAskClubi).toHaveBeenCalledWith([{ role: 'user', content: 'hola' }], 'Café', 7);
    expect(mockInsert).toHaveBeenCalledWith({ organization_id: 7, input_tokens: 10, output_tokens: 5 });
  });

  it('sin tabla (count null) no corta y sin nombre de org manda vacío', async () => {
    mockCount = null;
    mockGetCurrentUser.mockResolvedValue({ ...owner, organization: null });
    expect((await call(ask())).status).toBe(200);
    expect(mockAskClubi).toHaveBeenCalledWith(expect.any(Array), '', 7);
  });

  it('recorta a los últimos turnos empezando por uno del usuario', async () => {
    const messages = Array.from({ length: 11 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: `m${i}` }));
    await call(req({ messages }));
    const sent = mockAskClubi.mock.calls[0][0];
    expect(sent).toHaveLength(9);
    expect(sent[0]).toEqual({ role: 'user', content: 'm2' });
  });

  it('un turno largo fuera de la ventana no traba la charla', async () => {
    const messages = [
      { role: 'assistant', content: 'x'.repeat(20000) },
      ...Array.from({ length: 11 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: `m${i}` })),
    ];
    expect((await call(req({ messages }))).status).toBe(200);
  });

  it('texto vacío del modelo devuelve el mensaje de falla', async () => {
    mockAskClubi.mockResolvedValue({ text: '', inputTokens: 1, outputTokens: 0 });
    expect(await call(ask())).toEqual({ status: 200, data: { reply: 'clubi.failed' } });
  });

  it('500 si la API falla', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockAskClubi.mockRejectedValue(new Error('boom'));
    expect(await call(ask())).toEqual({ status: 500, data: { error: 'clubi.failed' } });
  });
});
