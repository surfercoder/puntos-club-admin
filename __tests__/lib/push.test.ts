import { pushToAllBeneficiaries, pushToBeneficiary } from '@/lib/push';

const mockFrom = jest.fn();
jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: (...a: unknown[]) => mockFrom(...a) }),
}));

const fetchMock = jest.fn();
global.fetch = fetchMock as unknown as typeof fetch;

// Cadena de PostgREST: cualquier metodo devuelve la misma cadena y el await
// resuelve al resultado que le toque.
function chain(result: unknown) {
  const c: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'order', 'range', 'update']) c[m] = jest.fn(() => c);
  c.then = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) => Promise.resolve(result).then(res, rej);
  return c;
}

const tokens = (n: number, start = 0) =>
  Array.from({ length: n }, (_, i) => ({ id: start + i, expo_push_token: `tok-${start + i}` }));

const expoOk = (n: number) => ({ ok: true, json: async () => ({ data: Array.from({ length: n }, () => ({ status: 'ok' })) }) });

const msg = { title: 'Hola', body: 'Mundo' };

describe('pushToAllBeneficiaries', () => {
  beforeEach(() => {
    mockFrom.mockReset();
    fetchMock.mockReset();
  });

  it('pagina de a 1000, saca tokens repetidos y manda en lotes de 100', async () => {
    const page1 = tokens(1000);
    const page2 = [...tokens(5, 1000), { id: 9999, expo_push_token: 'tok-0' }];
    const pages = [chain({ data: page1, error: null }), chain({ data: page2, error: null })];
    mockFrom.mockImplementation(() => pages.shift());
    fetchMock.mockImplementation(async (_url, init) => expoOk(JSON.parse(init.body).length));

    const result = await pushToAllBeneficiaries(msg);

    expect(result).toEqual({ sent: 1005, failed: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(11);
    const first = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(first[0]).toEqual({ to: 'tok-0', sound: 'default', ...msg });
  });

  it('tira si falla la lectura de tokens', async () => {
    mockFrom.mockReturnValue(chain({ data: null, error: { code: '42501' } }));
    await expect(pushToAllBeneficiaries(msg)).rejects.toEqual({ code: '42501' });
  });

  it('sin tokens no llama a Expo', async () => {
    mockFrom.mockReturnValue(chain({ data: [], error: null }));
    expect(await pushToAllBeneficiaries(msg)).toEqual({ sent: 0, failed: 0 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('da de baja DeviceNotRegistered y cuenta como fallido un lote caido', async () => {
    const update = chain({ error: null });
    mockFrom
      .mockReturnValueOnce(chain({ data: tokens(102), error: null }))
      .mockReturnValue(update);
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            { status: 'error', details: { error: 'DeviceNotRegistered' } },
            { status: 'error', details: { error: 'MessageRateExceeded' } },
            ...Array.from({ length: 98 }, () => ({ status: 'ok' })),
          ],
        }),
      })
      .mockResolvedValueOnce({ ok: false });

    expect(await pushToAllBeneficiaries(msg)).toEqual({ sent: 98, failed: 4 });
    expect(update.update).toHaveBeenCalledWith({ is_active: false });
    expect(update.eq).toHaveBeenCalledWith('id', 0);
  });

  it('una respuesta sin data no cuenta nada', async () => {
    mockFrom.mockReturnValue(chain({ data: tokens(1), error: null }));
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });
    expect(await pushToAllBeneficiaries(msg)).toEqual({ sent: 0, failed: 0 });
  });
});

describe('pushToBeneficiary', () => {
  beforeEach(() => {
    mockFrom.mockReset();
    fetchMock.mockReset();
  });

  it('sin tokens devuelve cero', async () => {
    mockFrom.mockReturnValue(chain({ data: null }));
    expect(await pushToBeneficiary(1, msg)).toEqual({ sent: 0, failed: 0 });
  });

  it('manda a cada dispositivo del beneficiario', async () => {
    mockFrom.mockReturnValue(chain({ data: tokens(2) }));
    fetchMock.mockResolvedValue(expoOk(2));
    expect(await pushToBeneficiary(1, msg)).toEqual({ sent: 2, failed: 0 });
  });
});
