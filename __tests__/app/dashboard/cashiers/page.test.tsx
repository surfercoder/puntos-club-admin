import CashiersPage from '@/app/dashboard/cashiers/page';

const getStaff = jest.fn();
const getUsageSummaryAction = jest.fn();

jest.mock('@/lib/staff/get-staff', () => ({
  getStaff: (...args: unknown[]) => getStaff(...args),
  staffName: (m: { firstName?: string; lastName?: string; email?: string }) =>
    `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() || m.email || '',
  staffInitials: (name: string) => (name ? name.slice(0, 2).toUpperCase() : '?'),
  filterStaff: (
    members: { firstName?: string; lastName?: string; email?: string; active: boolean; branchId: string | null }[],
    filters: { q: string; status: string; branch: string },
  ) =>
    members.filter((m) => {
      const label = `${m.firstName ?? ''} ${m.lastName ?? ''} ${m.email ?? ''}`.toLowerCase();
      if (filters.q && !label.includes(filters.q.toLowerCase())) return false;
      if (filters.status === 'active' && !m.active) return false;
      if (filters.status === 'inactive' && m.active) return false;
      if (filters.branch && filters.branch !== 'none' && m.branchId !== filters.branch) return false;
      return true;
    }),
}));
jest.mock('@/actions/dashboard/usage/actions', () => ({
  getUsageSummaryAction: (...args: unknown[]) => getUsageSummaryAction(...args),
}));
jest.mock('@/components/dashboard/app_user/app_user-form', () => ({
  __esModule: true,
  default: ({ lockedRoleName, defaultBranchId }: { lockedRoleName: string; defaultBranchId: string }) => (
    <div data-testid="user-form" data-branch={defaultBranchId}>{lockedRoleName}</div>
  ),
}));
jest.mock('@/components/dashboard/plan/plan-usage-badge', () => ({ PlanUsageBadge: () => <div /> }));
jest.mock('@/components/dashboard/plan/plan-usage-banner', () => ({ PlanUsageBanner: () => <div /> }));
jest.mock('@/components/dashboard/shared/table-pagination', () => ({ TablePagination: () => <div /> }));
jest.mock('@/components/dashboard/staff/staff-filters', () => ({ StaffFilters: () => <div /> }));
jest.mock('@/components/dashboard/staff/staff-stats', () => ({
  StaffStats: ({ data }: { data: unknown }) => <div data-testid="stats">{JSON.stringify(data)}</div>,
}));

const member = (over: Record<string, unknown> = {}) => ({
  id: '5',
  firstName: 'María',
  lastName: 'Juárez',
  email: 'maria@appcajeros.com',
  active: true,
  branchId: '3',
  branchName: 'Sucursal Centro',
  createdAt: '2026-01-01',
  operationsThisMonth: 245,
  lastOperationAt: '2026-08-13T11:32:00Z',
  ...over,
});

const render = async (params: Record<string, string> = {}) =>
  require('react-dom/server').renderToStaticMarkup(
    await CashiersPage({ searchParams: Promise.resolve(params) }),
  ) as string;

describe('CashiersPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getStaff.mockResolvedValue({
      orgId: 1,
      members: [member()],
      branches: [{ id: '3', name: 'Sucursal Centro' }],
    });
    getUsageSummaryAction.mockResolvedValue({
      plan: 'pro',
      features: [{ feature: 'cashiers', current_usage: 1, limit_value: 100 }],
    });
  });

  it('lists cashiers with their branch and monthly workload', async () => {
    const html = await render();
    expect(html).toContain('María Juárez');
    expect(html).toContain('Sucursal Centro');
    expect(html).toContain('245');
    expect(html).toContain('&quot;limit&quot;:100');
  });

  it('locks the create form to the cashier role', async () => {
    expect(await render()).toContain('cashier');
  });

  // ?assignTo viene del boton "asignar cajero" de una sucursal: sólo se
  // preselecciona si esa sucursal sigue existiendo.
  it('preselects the branch coming from assignTo', async () => {
    expect(await render({ assignTo: '3' })).toContain('data-branch="3"');
  });

  it('ignores an assignTo pointing at a branch that no longer exists', async () => {
    expect(await render({ assignTo: '99' })).toContain('data-branch=""');
  });

  it('flags a cashier with no branch and no operations', async () => {
    getStaff.mockResolvedValue({
      orgId: 1,
      members: [member({ branchId: null, branchName: null, operationsThisMonth: 0, lastOperationAt: null, active: false })],
      branches: [],
    });
    const html = await render();
    expect(html).toContain('noBranch');
    expect(html).toContain('never');
    expect(html).toContain('inactive');
  });

  it('falls back to N/A for a nameless cashier', async () => {
    getStaff.mockResolvedValue({
      orgId: 1,
      members: [member({ firstName: null, lastName: null, email: null })],
      branches: [],
    });
    expect(await render()).toContain('N/A');
  });

  it('shows the empty state when the filters match nothing', async () => {
    expect(await render({ q: 'zzz' })).toContain('empty');
  });

  it('reports no plan limit when the usage summary is missing', async () => {
    getUsageSummaryAction.mockResolvedValue(null);
    expect(await render()).toContain('&quot;limit&quot;:null');
  });

  it('accepts the status and branch filters', async () => {
    expect(await render({ status: 'active', branch: '3' })).toContain('María Juárez');
  });
});
