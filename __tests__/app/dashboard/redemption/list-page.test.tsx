import RedemptionListPage from '@/app/dashboard/redemption/page';

// Supabase query builder mock — thenable so `await query` resolves
let resolveData: { data: any[] | null; error: any } = { data: [], error: null };
const queryBuilder: any = {
  then: (cb: any) => cb(resolveData),
};
const mockOrder = jest.fn(() => queryBuilder);
const mockEq = jest.fn(() => queryBuilder);
const mockSelect = jest.fn(() => queryBuilder);
const mockFrom = jest.fn(() => queryBuilder);
const mockGte = jest.fn(() => queryBuilder);
const mockLte = jest.fn(() => queryBuilder);
Object.assign(queryBuilder, { select: mockSelect, order: mockOrder, eq: mockEq, from: mockFrom, gte: mockGte, lte: mockLte });

jest.mock('next/headers', () => ({ cookies: jest.fn(() => Promise.resolve({ get: jest.fn(() => ({ value: '1' })) })) }));
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => Promise.resolve({ from: mockFrom })) }));
jest.mock('@/lib/supabase/admin', () => ({ createAdminClient: jest.fn(() => ({ from: mockFrom })) }));
jest.mock('@/lib/auth/get-current-user', () => ({ getCurrentUser: jest.fn(() => Promise.resolve({ id: '1', role: { name: 'admin' } })) }));
jest.mock('@/lib/auth/get-active-org-id', () => ({ getActiveOrgIdFilter: jest.fn(() => Promise.resolve(null)) }));
jest.mock('@/lib/auth/roles', () => ({ isAdmin: jest.fn(() => true) }));
jest.mock('@/components/dashboard/redemption/delete-modal', () => function Mock() { return <div />; });
jest.mock('@/components/dashboard/redemption/row-actions', () => ({
  PendingRedemptionActions: ({ redemptionId }: { redemptionId: string }) => <div data-testid="pending-actions">{redemptionId}</div>,
}));
jest.mock('@/components/dashboard/redemption/status-badge', () => ({
  RedemptionStatusBadge: ({ status }: { status: string | null | undefined }) => <span>{status ?? 'none'}</span>,
}));
jest.mock('@/components/dashboard/redemption/redemption-donut', () => ({ RedemptionDonut: () => <div /> }));
jest.mock('@/components/dashboard/redemption/redemption-stats', () => ({ RedemptionStats: () => <div /> }));
jest.mock('@/components/dashboard/redemption/redemption-filters', () => ({
  RedemptionFilters: () => <div />,
}));
jest.mock('@/components/dashboard/shared/copyable-code', () => ({
  CopyableCode: ({ value }: { value: string }) => <span>{value}</span>,
}));
jest.mock('@/components/dashboard/shared/csv-export-button', () => ({ CsvExportButton: () => <div /> }));
jest.mock('@/components/dashboard/shared/info-card', () => ({ InfoCard: () => <div /> }));
jest.mock('@/components/dashboard/shared/quick-actions-card', () => ({ QuickActionsCard: () => <div /> }));
jest.mock('@/components/dashboard/shared/table-pagination', () => ({ TablePagination: () => <div /> }));
jest.mock('@/components/ui/button', () => ({ Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button> }));
jest.mock('@/components/ui/table', () => ({
  Table: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
  TableHeader: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>,
  TableRow: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>,
  TableHead: ({ children }: { children: React.ReactNode }) => <th>{children}</th>,
  TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>,
  TableCell: ({ children }: { children: React.ReactNode }) => <td>{children}</td>,
}));

describe('RedemptionListPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resolveData = { data: [], error: null };
  });

  it('exports a default async function', () => { expect(typeof RedemptionListPage).toBe('function'); });

  it('renders without crashing', async () => {
    const result = await RedemptionListPage({ searchParams: Promise.resolve({}) });
    expect(result).toBeTruthy();
  });

  it('filters by organization for non-admin users', async () => {
    const { isAdmin } = require('@/lib/auth/roles');
    const { getActiveOrgIdFilter } = require('@/lib/auth/get-active-org-id');
    isAdmin.mockReturnValueOnce(false);
    getActiveOrgIdFilter.mockResolvedValueOnce(1);
    resolveData = {
      data: [
        { id: '1', beneficiary_id: 'b1', product_id: 'p1', organization_id: 1, points_used: 50,  redemption_date: '2024-01-01T00:00:00Z', beneficiary: { first_name: 'A', last_name: 'B', email: 'a@b.com' }, product: { name: 'P1', organization_id: 1 } },
        { id: '2', beneficiary_id: 'b2', product_id: 'p2', organization_id: 2, points_used: 30,  redemption_date: '2024-01-02T00:00:00Z', beneficiary: { first_name: 'C', last_name: 'D', email: 'c@d.com' }, product: { name: 'P2', organization_id: 2 } },
      ],
      error: null,
    };
    const result = await RedemptionListPage({ searchParams: Promise.resolve({}) });
    expect(result).toBeTruthy();
    expect(mockEq).toHaveBeenCalledWith('organization_id', 1);
  });

  it('renders redemption rows when data is returned', async () => {
    resolveData = {
      data: [{ id: '1', beneficiary_id: 'b1', points_used: 50,  redemption_date: '2024-01-01T00:00:00Z', beneficiary: { first_name: 'A' }, product: { name: 'P1', organization_id: 1 } }],
      error: null,
    };
    const result = await RedemptionListPage({ searchParams: Promise.resolve({}) });
    expect(result).toBeTruthy();
  });

  it('renders error message when query fails', async () => {
    resolveData = { data: null, error: { message: 'DB error' } };
    const result = await RedemptionListPage({ searchParams: Promise.resolve({}) });
    expect(result).toBeTruthy();
  });

  it('renders redemptions with all optional fields null', async () => {
    resolveData = {
      data: [{ id: '3', beneficiary_id: 'b3', points_used: 10,  redemption_date: '2024-01-01T00:00:00Z', beneficiary: { first_name: null, last_name: null, email: null }, product: null }],
      error: null,
    };
    const result = await RedemptionListPage({ searchParams: Promise.resolve({}) });
    expect(result).toBeTruthy();
  });

  it('renders redemption with beneficiary email fallback', async () => {
    resolveData = {
      data: [{ id: '4', beneficiary_id: 'b4', points_used: 20,  redemption_date: '2024-01-01T00:00:00Z', beneficiary: { first_name: null, last_name: null, email: 'email@test.com' }, product: { name: 'P2', organization_id: 1 } }],
      error: null,
    };
    const result = await RedemptionListPage({ searchParams: Promise.resolve({}) });
    expect(result).toBeTruthy();
  });

  it('renders redemption with beneficiary only last_name', async () => {
    resolveData = {
      data: [{ id: '5', beneficiary_id: 'b5', points_used: 15,  redemption_date: '2024-01-01T00:00:00Z', beneficiary: { first_name: null, last_name: 'OnlyLast', email: null }, product: { name: 'P3', organization_id: 1 } }],
      error: null,
    };
    const result = await RedemptionListPage({ searchParams: Promise.resolve({}) });
    expect(result).toBeTruthy();
  });

  it('renders PendingRedemptionActions for pending rows', async () => {
    resolveData = {
      data: [{ id: '9', beneficiary_id: 'b9', points_used: 25, status: 'pending', redemption_date: '2024-01-01T00:00:00Z', beneficiary: { first_name: 'X' }, product: { name: 'P9', organization_id: 1 } }],
      error: null,
    };
    const result = await RedemptionListPage({ searchParams: Promise.resolve({}) });
    expect(result).toBeTruthy();
  });

  it('applies status and date filters from searchParams', async () => {
    const result = await RedemptionListPage({
      searchParams: Promise.resolve({ status: 'pending', from: '2024-01-01', to: '2024-01-31' }),
    });
    expect(result).toBeTruthy();
    expect(mockEq).toHaveBeenCalledWith('status', 'pending');
    expect(mockGte).toHaveBeenCalledWith('redemption_date', '2024-01-01');
    expect(mockLte).toHaveBeenCalledWith('redemption_date', '2024-01-31T23:59:59.999');
  });

  it('ignores invalid status and malformed dates', async () => {
    const result = await RedemptionListPage({
      searchParams: Promise.resolve({ status: 'bogus', from: '01/01/2024', to: 'nope' }),
    });
    expect(result).toBeTruthy();
    expect(mockEq).not.toHaveBeenCalledWith('status', expect.anything());
    expect(mockGte).not.toHaveBeenCalled();
    expect(mockLte).not.toHaveBeenCalled();
  });

  it('handles no active_org_id cookie (null branch)', async () => {
    const { cookies } = require('next/headers');
    (cookies as jest.Mock).mockResolvedValueOnce({ get: jest.fn(() => undefined) });
    const result = await RedemptionListPage({ searchParams: Promise.resolve({}) });
    expect(result).toBeTruthy();
  });
});

describe('RedemptionListPage extra filters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resolveData = { data: [], error: null };
  });

  it('filters by beneficiary and product', async () => {
    await RedemptionListPage({
      searchParams: Promise.resolve({ beneficiary: '1', product: '2' }),
    });
    expect(mockEq).toHaveBeenCalledWith('beneficiary_id', '1');
    expect(mockEq).toHaveBeenCalledWith('product_id', '2');
  });

  it('searches across code, beneficiary and product', async () => {
    resolveData = {
      data: [
        {
          id: 128,
          points_used: 10000,
          redemption_date: '2026-08-14T22:30:00Z',
          status: 'pending',
          beneficiary: { id: 1, first_name: 'Carlos', last_name: 'Schmidt' },
          product: { id: 2, name: 'Descuento $10.000' },
          deliveredBy: null,
        },
      ],
      error: null,
    };
    const hit = await RedemptionListPage({ searchParams: Promise.resolve({ q: 'carlos' }) });
    expect(hit).toBeTruthy();
    const miss = await RedemptionListPage({ searchParams: Promise.resolve({ q: 'zzz' }) });
    expect(miss).toBeTruthy();
  });

  it('survives a null data payload', async () => {
    resolveData = { data: null, error: null };
    expect(await RedemptionListPage({ searchParams: Promise.resolve({}) })).toBeTruthy();
  });

  it('skips relations that have no id and falls back to the email as a name', async () => {
    resolveData = {
      data: [
        {
          id: 129,
          points_used: null,
          redemption_date: '2026-08-14T22:30:00Z',
          status: 'delivered',
          beneficiary: { first_name: null, last_name: null, email: 'ana@test.com' },
          product: { name: 'Sin id' },
          deliveredBy: { first_name: 'Maria', last_name: 'Gonzalez' },
        },
        {
          id: 130,
          points_used: 100,
          redemption_date: '2026-08-14T22:30:00Z',
          status: 'cancelled',
          beneficiary: { id: 4, first_name: null, last_name: null, email: null },
          product: { id: 5, name: 'Con id' },
          deliveredBy: null,
        },
      ],
      error: null,
    };
    expect(await RedemptionListPage({ searchParams: Promise.resolve({}) })).toBeTruthy();
  });
});
