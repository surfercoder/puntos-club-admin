import MotherRulePage from '@/app/dashboard/points-rules/mother/page';

let ruleRows: unknown[] | null = [];
let branchRows: unknown[] | null = [];

const limit = jest.fn(() => Promise.resolve({ data: ruleRows, error: null }));
const order = jest.fn(() => Promise.resolve({ data: branchRows, error: null }));

const ruleBuilder: Record<string, unknown> = {};
Object.assign(ruleBuilder, { select: () => ruleBuilder, eq: () => ruleBuilder, limit });
const branchBuilder: Record<string, unknown> = {};
Object.assign(branchBuilder, { select: () => branchBuilder, eq: () => branchBuilder, order });

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    from: (table: string) => (table === 'points_rule' ? ruleBuilder : branchBuilder),
  })),
}));
jest.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: jest.fn(() => Promise.resolve({ id: '1' })),
}));
const getActiveOrgIdFilter = jest.fn(() => Promise.resolve(1 as number | null));
jest.mock('@/lib/auth/get-active-org-id', () => ({
  getActiveOrgIdFilter: (...args: unknown[]) => getActiveOrgIdFilter(...args),
}));
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));
jest.mock('@/components/dashboard/points-rules/mother-rule-form', () => ({
  MotherRuleForm: ({ rule }: { rule: unknown }) => (
    <div data-testid="mother-form">{JSON.stringify(rule)}</div>
  ),
}));

const render = async () =>
  require('react-dom/server').renderToStaticMarkup(await MotherRulePage()) as string;

const rule = (over: Record<string, unknown> = {}) => ({
  id: 1,
  name: 'Regla madre',
  rule_type: 'fixed_amount',
  config: { points_per_dollar: 2 },
  branch_id: null,
  is_active: true,
  updated_at: '2026-08-03T20:30:00Z',
  ...over,
});

describe('MotherRulePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ruleRows = [rule()];
    branchRows = [{ id: 7, name: 'Sucursal Centro' }];
    getActiveOrgIdFilter.mockResolvedValue(1);
  });

  it('hands the base rule to the form', async () => {
    const html = await render();
    expect(html).toContain('&quot;ruleType&quot;:&quot;fixed_amount&quot;');
    expect(html).toContain('&quot;value&quot;:&quot;2&quot;');
    expect(html).toContain('statusActive');
  });

  it('reads the percentage out of a percentage rule', async () => {
    ruleRows = [rule({ rule_type: 'percentage', config: { percentage: 5 } })];
    expect(await render()).toContain('&quot;value&quot;:&quot;5&quot;');
  });

  it('reads the points out of a per-item rule', async () => {
    ruleRows = [rule({ rule_type: 'fixed_per_item', config: { points_per_item: 50 } })];
    expect(await render()).toContain('&quot;value&quot;:&quot;50&quot;');
  });

  it('falls back to zero when the config is unreadable', async () => {
    ruleRows = [rule({ config: null })];
    expect(await render()).toContain('&quot;value&quot;:&quot;0&quot;');
  });

  it('falls back to fixed_amount for an unsupported rule type', async () => {
    ruleRows = [rule({ rule_type: 'tiered' })];
    expect(await render()).toContain('&quot;ruleType&quot;:&quot;fixed_amount&quot;');
  });

  it('shows the branch when the rule is scoped to one', async () => {
    ruleRows = [rule({ branch_id: 7 })];
    expect(await render()).toContain('&quot;branchId&quot;:&quot;7&quot;');
  });

  it('marks a disabled rule and hides the update stamp when missing', async () => {
    ruleRows = [rule({ is_active: false, updated_at: null })];
    const html = await render();
    expect(html).toContain('statusInactive');
    expect(html).not.toContain('lastUpdate');
  });

  it('renders with no branches configured', async () => {
    branchRows = null;
    expect(await render()).toContain('mother-form');
  });

  it('explains when the club has no base rule yet', async () => {
    ruleRows = [];
    expect(await render()).toContain('noRule');
  });

  it('survives a null payload', async () => {
    ruleRows = null;
    branchRows = null;
    expect(await render()).toContain('noRule');
  });

  it('asks for an organization when none is active', async () => {
    getActiveOrgIdFilter.mockResolvedValue(null);
    expect(await render()).toContain('noOrganization');
  });
});
