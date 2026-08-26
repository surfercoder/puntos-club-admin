import { render } from '@testing-library/react';

import CreatePurchasePage from '@/app/dashboard/purchase/create/page';

// El panel se arma con el desglose de explain_points_for_amount (una fila por
// regla que aplica) y un segundo select que trae la vigencia de cada una.
let breakdownRows: unknown[] | null = [];
let periodRows: unknown[] | null = [];

const rpc = jest.fn(() => Promise.resolve({ data: breakdownRows, error: null }));
const inFilter = jest.fn(() => Promise.resolve({ data: periodRows, error: null }));
const builder: Record<string, unknown> = {};
Object.assign(builder, {
  select: jest.fn(() => builder),
  in: inFilter,
});

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({ from: jest.fn(() => builder), rpc })),
}));
jest.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: jest.fn(() => Promise.resolve({ id: '1' })),
}));
const getActiveOrgIdFilter = jest.fn(() => Promise.resolve(1 as number | null));
jest.mock('@/lib/auth/get-active-org-id', () => ({
  getActiveOrgIdFilter: (...args: unknown[]) => getActiveOrgIdFilter(...args),
}));
jest.mock('@/components/dashboard/purchase/purchase-form', () => {
  return function MockPurchaseForm() { return <div data-testid="purchase-form" />; };
});
let received: unknown;
jest.mock('@/components/dashboard/purchase/active-rule-card', () => ({
  ActiveRuleCard: ({ rules }: { rules: unknown }) => {
    received = rules;
    return <div data-testid="active-rule">{JSON.stringify(rules)}</div>;
  },
}));

const row = (over: Record<string, unknown> = {}) => ({
  rule_id: 1,
  name: 'Regla madre',
  rule_type: 'fixed_amount',
  is_default: true,
  points: 1000,
  ...over,
});

describe('CreatePurchasePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    breakdownRows = [];
    periodRows = [];
    received = undefined;
    getActiveOrgIdFilter.mockResolvedValue(1);
  });

  it('suma los aportes de todas las reglas y les pega su vigencia', async () => {
    breakdownRows = [
      row(),
      row({ rule_id: 2, name: 'Especial Invierno', is_default: false, points: 100 }),
    ];
    periodRows = [
      { id: 2, valid_from: '2026-06-21', valid_until: '2026-09-21' },
    ];

    render(await CreatePurchasePage());
    expect(rpc).toHaveBeenCalledWith(
      'explain_points_for_amount',
      expect.objectContaining({ p_amount: 1000, p_organization_id: 1 }),
    );
    expect(received).toEqual({
      sampleAmount: 1000,
      samplePoints: 1100,
      rules: [
        { id: 1, name: 'Regla madre', isDefault: true, points: 1000, validFrom: null, validUntil: null },
        {
          id: 2,
          name: 'Especial Invierno',
          isDefault: false,
          points: 100,
          validFrom: '2026-06-21',
          validUntil: '2026-09-21',
        },
      ],
    });
  });

  it('no pide vigencias cuando no aplica ninguna regla', async () => {
    breakdownRows = [];
    render(await CreatePurchasePage());
    expect(inFilter).not.toHaveBeenCalled();
    expect(received).toBeNull();
  });

  it('sobrevive a un desglose nulo', async () => {
    breakdownRows = null;
    render(await CreatePurchasePage());
    expect(received).toBeNull();
  });

  it('sobrevive a un select de vigencias nulo y a puntos nulos', async () => {
    breakdownRows = [row({ is_default: null, points: null })];
    periodRows = null;
    render(await CreatePurchasePage());
    expect(received).toEqual({
      sampleAmount: 1000,
      samplePoints: 0,
      rules: [
        { id: 1, name: 'Regla madre', isDefault: false, points: 0, validFrom: null, validUntil: null },
      ],
    });
  });

  it('ni consulta cuando no hay organización activa', async () => {
    getActiveOrgIdFilter.mockResolvedValue(null);
    render(await CreatePurchasePage());
    expect(rpc).not.toHaveBeenCalled();
    expect(received).toBeNull();
  });
});
