import EditCampaignPage from '@/app/dashboard/points-rules/edit/[id]/page';

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
jest.mock('@/components/dashboard/points-rules/campaign-form', () => ({
  CampaignForm: ({ initial }: { initial: unknown }) => (
    <div data-testid="campaign-form">{JSON.stringify(initial)}</div>
  ),
}));

const render = async () =>
  require('react-dom/server').renderToStaticMarkup(
    await EditCampaignPage({ params: Promise.resolve({ id: '42' }) }),
  ) as string;

const rule = (over: Record<string, unknown> = {}) => ({
  id: 42,
  name: 'Doble Puntos',
  display_name: 'Doble Puntos 🎉',
  description: 'Fines de semana',
  rule_type: 'fixed_per_sale',
  config: { points_per_sale: 200 },
  start_date: '2026-05-25',
  end_date: '2026-08-25',
  days_of_week: [0, 6],
  time_start: '10:00:00',
  time_end: '18:00:00',
  branch_id: null,
  branch_ids: [1],
  ...over,
});

describe('EditCampaignPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ruleRows = [rule()];
    branchRows = [
      { id: 1, name: 'Casa Central' },
      { id: 2, name: 'Sucursal Belgrano' },
    ];
    getActiveOrgIdFilter.mockResolvedValue(1);
  });

  it('fills the form with the stored campaign', async () => {
    const html = await render();
    expect(html).toContain('&quot;name&quot;:&quot;Doble Puntos 🎉&quot;');
    expect(html).toContain('&quot;points&quot;:&quot;200&quot;');
    expect(html).toContain('&quot;timeStart&quot;:&quot;10:00&quot;');
    expect(html).toContain('&quot;branchIds&quot;:[&quot;1&quot;]');
    expect(html).not.toContain('legacyType');
  });

  it('reads a percentage campaign', async () => {
    ruleRows = [rule({ rule_type: 'percentage', config: { percentage: 10 } })];
    const html = await render();
    expect(html).toContain('&quot;assignment&quot;:&quot;percentage&quot;');
    expect(html).toContain('&quot;percentage&quot;:&quot;10&quot;');
  });

  it('warns about a legacy rule type and clears its value', async () => {
    ruleRows = [rule({ rule_type: 'fixed_amount', config: { points_per_dollar: 2 } })];
    const html = await render();
    expect(html).toContain('legacyType');
    expect(html).toContain('&quot;points&quot;:&quot;&quot;');
  });

  it('treats a campaign without branches as every branch', async () => {
    ruleRows = [rule({ branch_ids: null })];
    expect(await render()).toContain('&quot;branchIds&quot;:[&quot;1&quot;,&quot;2&quot;]');
  });

  it('drops a stored branch that was deactivated', async () => {
    // Si la baja siguiera contando, dos guardadas contra dos activas darían
    // "todas las sucursales" al guardar.
    ruleRows = [rule({ branch_ids: [1, 9] })];
    expect(await render()).toContain('&quot;branchIds&quot;:[&quot;1&quot;]');
  });

  it('keeps the single branch of an old campaign', async () => {
    ruleRows = [rule({ branch_ids: null, branch_id: 2 })];
    expect(await render()).toContain('&quot;branchIds&quot;:[&quot;2&quot;]');
  });

  it('falls back to empty fields when the row is half filled', async () => {
    ruleRows = [
      rule({
        display_name: null,
        description: null,
        config: null,
        start_date: null,
        end_date: null,
        days_of_week: null,
        time_start: null,
        time_end: null,
      }),
    ];
    const html = await render();
    expect(html).toContain('&quot;name&quot;:&quot;Doble Puntos&quot;');
    expect(html).toContain('&quot;description&quot;:&quot;&quot;');
    expect(html).toContain('&quot;points&quot;:&quot;&quot;');
    expect(html).toContain('&quot;daysOfWeek&quot;:[]');
  });

  it('says so when the campaign is not in the club', async () => {
    ruleRows = [];
    branchRows = null;
    expect(await render()).toContain('notFound');
  });

  it('survives a null payload', async () => {
    ruleRows = null;
    expect(await render()).toContain('notFound');
  });

  it('asks for an organization when none is active', async () => {
    getActiveOrgIdFilter.mockResolvedValue(null);
    expect(await render()).toContain('noOrganization');
  });
});
