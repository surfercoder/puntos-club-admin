const mockCreate = jest.fn();
jest.mock('@anthropic-ai/sdk', () => {
  const MockAnthropic = function () {
    return { beta: { messages: { create: (...a: unknown[]) => mockCreate(...a) } } };
  };
  return { __esModule: true, default: MockAnthropic };
});

jest.mock('@/actions/dashboard/analytics/actions', () => ({
  getDashboardKpis: jest.fn(async () => ({ kpi: 1 })),
  getMonthlyPurchaseStats: jest.fn(async () => []),
  getMonthlyPointsStats: jest.fn(async () => []),
  getMonthlyMemberStats: jest.fn(async () => []),
  getTopProducts: jest.fn(async () => []),
  getBranchPerformance: jest.fn(async () => []),
}));

let mockRows: unknown = [];
let mockError: { message: string } | null = null;
const mockEq = jest.fn();
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(async () => {
    const q = {
      select: () => q,
      eq: (...a: unknown[]) => (mockEq(...a), q),
      order: () => q,
      limit: async () => ({ data: mockRows, error: mockError }),
    };
    return { from: () => q };
  }),
}));

import * as analytics from '@/actions/dashboard/analytics/actions';
import { askClubi } from '@/lib/ai/clubi';

const usage = (extra = {}) => ({ input_tokens: 10, output_tokens: 3, ...extra });
const text = (t: string, extra = {}) => ({
  stop_reason: 'end_turn',
  content: [{ type: 'thinking', thinking: '' }, { type: 'text', text: t }],
  usage: usage(extra),
});
const toolUse = (calls: Array<[string, unknown]>) => ({
  stop_reason: 'tool_use',
  content: [
    { type: 'text', text: 'Busco los datos.' },
    ...calls.map(([name, input], i) => ({ type: 'tool_use', id: `t${i}`, name, input })),
  ],
  usage: usage({ cache_read_input_tokens: 100, cache_creation_input_tokens: 5 }),
});

const resultsOf = (call: number) => {
  const msgs = mockCreate.mock.calls[call][0].messages;
  return msgs[msgs.length - 1].content;
};

beforeEach(() => {
  mockCreate.mockReset();
  mockRows = [];
  mockError = null;
});

describe('askClubi', () => {
  it('responde con texto y suma tokens', async () => {
    mockCreate.mockResolvedValueOnce(text(' hola '));
    const reply = await askClubi([{ role: 'user', content: 'hi' }], 'Café', 7);
    expect(reply).toEqual({ text: 'hola', inputTokens: 10, outputTokens: 3 });
    const params = mockCreate.mock.calls[0][0];
    expect(params.model).toBe('claude-opus-5-5');
    expect(params.tool_choice).toEqual({ type: 'auto' });
    expect(params.system[1].text).toContain('Café');
  });

  it('corre las herramientas, clampa meses y reporta errores al modelo', async () => {
    mockRows = [
      { available_points: 5, total_points_earned: 9, total_points_redeemed: 4, beneficiary: [{ first_name: 'Ana', last_name: 'Paz' }] },
      { available_points: 1, total_points_earned: 1, total_points_redeemed: 0, beneficiary: { first_name: null, last_name: null } },
      { available_points: 0, total_points_earned: 0, total_points_redeemed: 0, beneficiary: null },
    ];
    mockCreate
      .mockResolvedValueOnce(
        toolUse([
          ['get_kpis', {}],
          ['get_monthly_purchases', { months: 40 }],
          ['get_monthly_points', { months: 0 }],
          ['get_monthly_members', { months: 1.5 }],
          ['get_top_products', {}],
          ['get_branch_performance', {}],
          ['get_top_beneficiaries', {}],
          ['nope', null],
        ]),
      )
      .mockResolvedValueOnce(text('listo', { cache_read_input_tokens: 2 }));

    const reply = await askClubi([{ role: 'user', content: 'datos' }], '', 7);

    expect(reply).toEqual({ text: 'listo', inputTokens: 127, outputTokens: 6 });
    expect(analytics.getMonthlyPurchaseStats).toHaveBeenCalledWith(12);
    expect(analytics.getMonthlyPointsStats).toHaveBeenCalledWith(1);
    expect(analytics.getMonthlyMemberStats).toHaveBeenCalledWith(6);
    expect(analytics.getTopProducts).toHaveBeenCalledWith(10);
    expect(mockEq).toHaveBeenCalledWith('organization_id', 7);
    const results = resultsOf(1);
    expect(JSON.parse(results[6].content)).toEqual([
      { name: 'Ana Paz', available_points: 5, total_points_earned: 9, total_points_redeemed: 4 },
      { name: '(sin nombre)', available_points: 1, total_points_earned: 1, total_points_redeemed: 0 },
      { name: '(sin nombre)', available_points: 0, total_points_earned: 0, total_points_redeemed: 0 },
    ]);
    expect(results[7]).toMatchObject({ is_error: true, content: 'Error: Herramienta desconocida: nope' });
  });

  it('top beneficiarios sin datos devuelve lista vacía', async () => {
    mockRows = null;
    mockCreate.mockResolvedValueOnce(toolUse([['get_top_beneficiaries', {}]])).mockResolvedValueOnce(text('x'));
    await askClubi([{ role: 'user', content: 'q' }], 'o', 1);
    expect(resultsOf(1)[0].content).toBe('[]');
  });

  it('un error de la consulta llega al modelo como is_error', async () => {
    mockError = { message: 'permiso denegado' };
    mockCreate.mockResolvedValueOnce(toolUse([['get_top_beneficiaries', {}]])).mockResolvedValueOnce(text('x'));
    await askClubi([{ role: 'user', content: 'q' }], 'o', 1);
    expect(resultsOf(1)[0]).toMatchObject({ is_error: true, content: 'Error: permiso denegado' });
  });

  it('en la última vuelta apaga las herramientas', async () => {
    mockCreate
      .mockResolvedValueOnce(toolUse([['get_kpis', {}]]))
      .mockResolvedValueOnce(toolUse([['get_kpis', {}]]))
      .mockResolvedValueOnce(toolUse([['get_kpis', {}]]))
      .mockResolvedValueOnce(text('fin'));
    await askClubi([{ role: 'user', content: 'q' }], 'o', 1);
    expect(mockCreate.mock.calls.map((c) => c[0].tool_choice.type)).toEqual(['auto', 'auto', 'auto', 'none']);
  });

  it('respeta ANTHROPIC_CLUBI_MODEL', async () => {
    process.env.ANTHROPIC_CLUBI_MODEL = 'otro';
    try {
      await jest.isolateModulesAsync(async () => {
        const mod = await import('@/lib/ai/clubi');
        mockCreate.mockResolvedValueOnce(text('x'));
        await mod.askClubi([{ role: 'user', content: 'q' }], 'o', 1);
      });
      expect(mockCreate.mock.calls[0][0].model).toBe('otro');
    } finally {
      delete process.env.ANTHROPIC_CLUBI_MODEL;
    }
  });
});
