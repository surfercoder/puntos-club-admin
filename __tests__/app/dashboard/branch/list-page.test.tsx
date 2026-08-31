import BranchListPage from '@/app/dashboard/branch/page';

let branchRows: unknown[] | null = [];
let cashierRows: unknown[] | null = [];
let branchError: unknown = null;

const branchEq = jest.fn();
const cashierEq = jest.fn();

const makeBranchBuilder = () => {
  const builder: Record<string, unknown> = {};
  const settled = () => Promise.resolve({ data: branchRows, error: branchError });
  Object.assign(builder, {
    select: () => builder,
    order: () => Object.assign(settled(), builder),
    eq: (...args: unknown[]) => {
      branchEq(...args);
      return Object.assign(settled(), builder);
    },
    then: (resolve: (v: unknown) => unknown) => settled().then(resolve),
  });
  return builder;
};

const makeCashierBuilder = () => {
  const builder: Record<string, unknown> = {};
  const settled = () => Promise.resolve({ data: cashierRows, error: null });
  Object.assign(builder, {
    select: () => builder,
    eq: (...args: unknown[]) => {
      cashierEq(...args);
      return Object.assign(settled(), builder);
    },
    then: (resolve: (v: unknown) => unknown) => settled().then(resolve),
  });
  return builder;
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    from: (table: string) => (table === 'branch' ? makeBranchBuilder() : makeCashierBuilder()),
  })),
}));
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => Promise.resolve({ get: jest.fn(() => ({ value: '1' })) })),
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
jest.mock('@/components/dashboard/branch/delete-modal', () => function Mock() { return <div />; });
jest.mock('@/components/dashboard/branch/branch-filters', () => ({ BranchFilters: () => <div /> }));
jest.mock('@/components/dashboard/branch/branch-form-with-address', () => ({
  __esModule: true,
  default: () => <div data-testid="branch-form" />,
}));
jest.mock('@/components/dashboard/plan/plan-usage-badge', () => ({ PlanUsageBadge: () => <div /> }));
jest.mock('@/components/dashboard/plan/plan-usage-banner', () => ({ PlanUsageBanner: () => <div /> }));
jest.mock('@/components/dashboard/shared/table-pagination', () => ({ TablePagination: () => <div /> }));

const branch = (over: Record<string, unknown> = {}) => ({
  id: 1,
  name: 'Sucursal Centro',
  phone: '+54 9 11 1234',
  active: true,
  address: { street: 'Av. Corrientes', number: '1234', city: 'CABA' },
  ...over,
});

const cashier = (over: Record<string, unknown> = {}) => ({
  id: 5,
  first_name: 'María',
  last_name: 'Juárez',
  email: 'maria@appcajeros.com',
  active: true,
  branch_id: 1,
  role: { name: 'cashier' },
  ...over,
});

const render = async (params: Record<string, string> = {}) =>
  require('react-dom/server').renderToStaticMarkup(
    await BranchListPage({ searchParams: Promise.resolve(params) }),
  ) as string;

describe('BranchListPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    branchRows = [branch()];
    cashierRows = [cashier()];
    branchError = null;
    getActiveOrgIdFilter.mockResolvedValue(1);
  });

  it('shows the cashier assigned to each branch', async () => {
    const html = await render();
    expect(html).toContain('María Juárez');
    expect(html).toContain('maria@appcajeros.com');
    expect(html).toContain('Av. Corrientes 1234, CABA');
  });

  it('flags a branch with no cashier', async () => {
    cashierRows = [];
    const html = await render();
    expect(html).toContain('noCashier');
    expect(html).toContain('assignCashier');
  });

  it('scopes both queries to the active organization', async () => {
    await render();
    expect(branchEq).toHaveBeenCalledWith('organization_id', 1);
    expect(cashierEq).toHaveBeenCalledWith('organization_id', 1);
  });

  it('skips the org filter when no organization is active', async () => {
    getActiveOrgIdFilter.mockResolvedValue(null);
    await render();
    expect(branchEq).not.toHaveBeenCalledWith('organization_id', expect.anything());
  });

  it('renders the error state when the branch query fails', async () => {
    branchError = { message: 'boom' };
    expect(await render()).toContain('error');
  });

  it('handles a branch with no address or phone', async () => {
    branchRows = [branch({ address: null, phone: null, active: false })];
    const html = await render();
    expect(html).toContain('N/A');
    expect(html).toContain('inactive');
  });

  it('filters by name, status and cashier assignment', async () => {
    branchRows = [branch(), branch({ id: 2, name: 'Sucursal Norte', active: false })];
    expect(await render({ q: 'centro' })).toContain('Sucursal Centro');
    expect(await render({ status: 'active' })).toContain('Sucursal Centro');
    expect(await render({ status: 'inactive' })).toContain('Sucursal Norte');
    expect(await render({ cashier: 'assigned' })).toContain('Sucursal Centro');
    expect(await render({ cashier: 'unassigned' })).toContain('Sucursal Norte');
  });

  it('shows the empty state when nothing matches', async () => {
    expect(await render({ q: 'zzz' })).toContain('empty');
  });

  it('ignores rows whose role join came back empty', async () => {
    cashierRows = [cashier({ role: null })];
    expect(await render()).toContain('noCashier');
  });

  it('lists every cashier of a branch', async () => {
    cashierRows = [cashier(), cashier({ id: 8, first_name: 'Juan', last_name: 'Pérez' })];
    const html = await render();
    expect(html).toContain('María Juárez');
    expect(html).toContain('Juan Pérez');
    expect(html).toContain('cashierCount');
  });

  it('falls back to a placeholder avatar for a nameless cashier', async () => {
    cashierRows = [cashier({ first_name: null, last_name: null, email: null })];
    expect(await render()).toContain('?');
  });

  it('survives null payloads', async () => {
    branchRows = null;
    cashierRows = null;
    expect(await render()).toContain('empty');
  });
});
