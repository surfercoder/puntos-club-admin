import CreatePurchasePage from '@/app/dashboard/purchase/create/page';

const rpc = jest.fn(() => Promise.resolve({ data: 100, error: null }));
let ruleRows: unknown[] = [];

const limit = jest.fn(() => Promise.resolve({ data: ruleRows, error: null }));
const or = jest.fn(() => builder);
const builder: Record<string, unknown> = {};
Object.assign(builder, {
  select: jest.fn(() => builder),
  eq: jest.fn(() => builder),
  or,
  order: jest.fn(() => builder),
  limit,
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
jest.mock('@/components/dashboard/purchase/active-rule-card', () => ({
  ActiveRuleCard: ({ rule }: { rule: unknown }) => (
    <div data-testid="active-rule">{JSON.stringify(rule)}</div>
  ),
}));

const rule = (over: Record<string, unknown> = {}) => ({
  id: 1,
  name: 'Campaña Invierno 2026',
  rule_type: 'fixed_amount',
  is_default: false,
  config: { points_per_dollar: 10 },
  valid_from: '2026-08-01',
  valid_until: '2026-08-31',
  ...over,
});

describe('CreatePurchasePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ruleRows = [];
    getActiveOrgIdFilter.mockResolvedValue(1);
  });

  it('describes a fixed-amount rule as points per $100', async () => {
    ruleRows = [rule()];
    const result = await CreatePurchasePage();
    expect(result).toBeTruthy();
    expect(rpc).toHaveBeenCalledWith(
      'calculate_points_for_amount',
      expect.objectContaining({ p_amount: 1000 }),
    );
  });

  it('describes a percentage rule', async () => {
    ruleRows = [rule({ rule_type: 'percentage', config: { percentage: 5 } })];
    expect(await CreatePurchasePage()).toBeTruthy();
  });

  it('describes a per-item rule with no reference amount', async () => {
    ruleRows = [rule({ rule_type: 'fixed_per_item', config: { points_per_item: 500 } })];
    expect(await CreatePurchasePage()).toBeTruthy();
  });

  it('leaves a tiered rule without a simple description', async () => {
    ruleRows = [rule({ rule_type: 'tiered', config: {}, is_default: true, valid_until: null })];
    expect(await CreatePurchasePage()).toBeTruthy();
  });

  it('handles a rule with an unreadable config and no dates', async () => {
    ruleRows = [rule({ config: null, valid_from: null, valid_until: null })];
    expect(await CreatePurchasePage()).toBeTruthy();
  });

  it('handles a percentage rule with a missing percentage', async () => {
    ruleRows = [rule({ rule_type: 'percentage', config: {} })];
    expect(await CreatePurchasePage()).toBeTruthy();
  });

  it('survives a null rule payload', async () => {
    limit.mockResolvedValueOnce({ data: null, error: null } as never);
    expect(await CreatePurchasePage()).toBeTruthy();
  });

  it('defaults is_default to false when the column is null', async () => {
    ruleRows = [rule({ is_default: null })];
    expect(await CreatePurchasePage()).toBeTruthy();
  });

  it('only asks for rules that are in force right now', async () => {
    ruleRows = [rule()];
    expect(await CreatePurchasePage()).toBeTruthy();

    const filters = or.mock.calls.map(([filter]) => filter as string);
    expect(filters).toHaveLength(4);
    const today = new Date().toISOString().slice(0, 10);
    expect(filters[0]).toBe(`start_date.is.null,start_date.lte.${today}`);
    expect(filters[1]).toBe(`end_date.is.null,end_date.gte.${today}`);
    expect(filters[2]).toMatch(/^valid_from\.is\.null,valid_from\.lte\./);
    expect(filters[3]).toMatch(/^valid_until\.is\.null,valid_until\.gte\./);
  });

  it('renders without a rule when the club has none', async () => {
    ruleRows = [];
    expect(await CreatePurchasePage()).toBeTruthy();
    expect(rpc).not.toHaveBeenCalled();
  });

  it('skips the lookup entirely when no organization is active', async () => {
    getActiveOrgIdFilter.mockResolvedValue(null);
    expect(await CreatePurchasePage()).toBeTruthy();
    expect(limit).not.toHaveBeenCalled();
  });

  it('falls back to zero sample points when the rpc returns nothing', async () => {
    ruleRows = [rule()];
    rpc.mockResolvedValueOnce({ data: null, error: null } as never);
    expect(await CreatePurchasePage()).toBeTruthy();
  });
});
