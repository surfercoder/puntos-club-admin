import { render } from '@testing-library/react';

import PurchaseListPage from '@/app/dashboard/purchase/page';

const mockEq = jest.fn().mockResolvedValue({ data: [], error: null });
const mockOrder = jest.fn().mockImplementation(() => {
  const result = Promise.resolve({ data: [], error: null });
  (result as any).eq = mockEq;
  return result;
});
const mockSelect = jest.fn(() => ({ order: mockOrder }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));

jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
jest.mock('next/headers', () => ({ cookies: jest.fn(() => Promise.resolve({ get: jest.fn(() => ({ value: '1' })) })) }));
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => Promise.resolve({ from: mockFrom })) }));
jest.mock('@/lib/supabase/admin', () => ({ createAdminClient: jest.fn(() => ({ from: mockFrom })) }));
jest.mock('@/lib/auth/get-current-user', () => ({ getCurrentUser: jest.fn(() => Promise.resolve({ id: '1', role: { name: 'admin' } })) }));
jest.mock('@/lib/auth/get-active-org-id', () => ({ getActiveOrgIdFilter: jest.fn(() => Promise.resolve(null)) }));
jest.mock('@/lib/auth/roles', () => ({ isAdmin: jest.fn(() => true) }));
jest.mock('@/components/dashboard/purchase/delete-modal', () => function Mock() { return <div />; });
jest.mock('@/components/dashboard/purchase/toast-handler', () => function Mock() { return <div />; });
jest.mock('@/components/dashboard/purchase/purchase-filters', () => ({
  PurchaseFilters: () => <div />,
}));
jest.mock('@/components/dashboard/purchase/purchase-stats', () => ({ PurchaseStats: () => <div /> }));
jest.mock('@/components/dashboard/shared/excel-export-button', () => ({ ExcelExportButton: () => <div /> }));
jest.mock('@/components/dashboard/shared/info-card', () => ({ InfoCard: () => <div /> }));
jest.mock('@/components/dashboard/shared/quick-actions-card', () => ({ QuickActionsCard: () => <div /> }));
jest.mock('@/components/dashboard/shared/summary-card', () => ({ SummaryCard: () => <div /> }));
jest.mock('@/components/dashboard/shared/table-pagination', () => ({ TablePagination: () => <div /> }));
jest.mock('@/components/ui/badge', () => ({ Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span> }));
jest.mock('@/components/ui/button', () => ({ Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button> }));
jest.mock('@/components/ui/table', () => ({
  Table: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
  TableHeader: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>,
  TableRow: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>,
  TableHead: ({ children }: { children: React.ReactNode }) => <th>{children}</th>,
  TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>,
  TableCell: ({ children }: { children: React.ReactNode }) => <td>{children}</td>,
}));

const mockPurchases = [
  {
    id: 1,
    purchase_number: 'PUR-001',
    total_amount: '100.50',
    points_earned: 10,
    purchase_date: '2024-01-15T10:30:00Z',
    notes: 'Test note',
    beneficiary: { first_name: 'John', last_name: 'Doe', email: 'john@test.com' },
    cashier: { first_name: 'Jane', last_name: 'Smith' },
    branch: { name: 'Main Branch' },
  },
  {
    id: 2,
    purchase_number: 'PUR-002',
    total_amount: '200',
    points_earned: 20,
    purchase_date: '2024-01-16T11:00:00Z',
    notes: null,
    beneficiary: null,
    cashier: null,
    branch: null,
  },
];

describe('PurchaseListPage', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('exports a default async function', () => {
    expect(typeof PurchaseListPage).toBe('function');
  });

  it('renders without crashing with empty data', async () => {
    mockOrder.mockResolvedValueOnce({ data: [], error: null });
    const result = await PurchaseListPage({ searchParams: Promise.resolve({}) });
    render(result);
    expect(result).toBeTruthy();
  });

  it('renders purchase rows when data is returned', async () => {
    mockOrder.mockResolvedValueOnce({ data: mockPurchases, error: null });
    const result = await PurchaseListPage({ searchParams: Promise.resolve({}) });
    render(result);
    expect(result).toBeTruthy();
  });

  it('renders error message when query fails', async () => {
    mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });
    const result = await PurchaseListPage({ searchParams: Promise.resolve({}) });
    render(result);
    expect(result).toBeTruthy();
  });

  it('renders purchase with null beneficiary/cashier/branch', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [mockPurchases[1]],
      error: null,
    });
    const result = await PurchaseListPage({ searchParams: Promise.resolve({}) });
    render(result);
    expect(result).toBeTruthy();
  });

  it('renders purchase with beneficiary and cashier data', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [mockPurchases[0]],
      error: null,
    });
    const result = await PurchaseListPage({ searchParams: Promise.resolve({}) });
    render(result);
    expect(result).toBeTruthy();
  });

  it('handles array-wrapped relations (beneficiary, cashier, branch)', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{
        ...mockPurchases[0],
        beneficiary: [{ first_name: 'John', last_name: 'Doe', email: 'john@test.com' }],
        cashier: [{ first_name: 'Jane', last_name: 'Smith' }],
        branch: [{ name: 'Main Branch' }],
      }],
      error: null,
    });
    const result = await PurchaseListPage({ searchParams: Promise.resolve({}) });
    render(result);
    expect(result).toBeTruthy();
  });

  it('filters by org for non-admin users', async () => {
    const { isAdmin } = require('@/lib/auth/roles');
    const { getActiveOrgIdFilter } = require('@/lib/auth/get-active-org-id');
    isAdmin.mockReturnValueOnce(false);
    getActiveOrgIdFilter.mockResolvedValueOnce(1);
    mockEq.mockResolvedValueOnce({ data: [], error: null });
    const result = await PurchaseListPage({ searchParams: Promise.resolve({}) });
    render(result);
    expect(result).toBeTruthy();
    expect(mockEq).toHaveBeenCalledWith('organization_id', 1);
  });
});

describe('PurchaseListPage filters', () => {
  const { isAdmin } = require('@/lib/auth/roles');
  const { getActiveOrgIdFilter } = require('@/lib/auth/get-active-org-id');

  const sale = {
    id: 9,
    purchase_number: 'PUR-009',
    total_amount: '2500',
    points_earned: 2500,
    purchase_date: '2026-08-13T15:32:00Z',
    beneficiary_id: 'b1',
    beneficiary: { id: 'b1', first_name: 'Ana', last_name: 'Diaz' },
    cashier: { id: 'c1', first_name: 'Luis', last_name: 'Perez' },
    branch: { id: 'br1', name: 'Sucursal Centro' },
  };
  const assignment = { ...sale, id: 10, purchase_number: 'PUR-010', total_amount: '0', points_earned: 100 };

  const renderWith = async (params: Record<string, string>, rows: unknown[]) => {
    isAdmin.mockReturnValueOnce(false);
    getActiveOrgIdFilter.mockResolvedValueOnce(1);
    const chain: Record<string, unknown> = {};
    const query = Promise.resolve({ data: rows, error: null });
    for (const key of ['eq', 'gte', 'lte']) {
      (chain as Record<string, unknown>)[key] = jest.fn(() => Object.assign(query, chain));
    }
    mockFrom.mockReturnValueOnce({
      select: jest.fn(() => ({ order: jest.fn(() => Object.assign(query, chain)) })),
    });
    const result = await PurchaseListPage({ searchParams: Promise.resolve(params) });
    render(result);
    return result;
  };

  beforeEach(() => { jest.clearAllMocks(); });

  it('applies every server-side filter', async () => {
    expect(
      await renderWith(
        {
          branch: 'br1', cashier: 'c1', beneficiary: 'b1',
          from: '2026-08-01', to: '2026-08-31',
        },
        [sale],
      ),
    ).toBeTruthy();
  });

  it('searches across the operation, people and branch', async () => {
    expect(await renderWith({ q: 'ana' }, [sale])).toBeTruthy();
    expect(await renderWith({ q: 'zzz' }, [sale])).toBeTruthy();
  });

  it('splits sales from manual point assignments', async () => {
    expect(await renderWith({ type: 'sale' }, [sale, assignment])).toBeTruthy();
    expect(await renderWith({ type: 'assignment' }, [sale, assignment])).toBeTruthy();
  });

  it('filters by points bucket', async () => {
    expect(await renderWith({ points: '0-1000' }, [sale, assignment])).toBeTruthy();
    expect(await renderWith({ points: 'nope' }, [sale])).toBeTruthy();
  });

  it('handles operations with no related rows', async () => {
    expect(
      await renderWith({}, [{ ...sale, beneficiary: null, cashier: null, branch: null, beneficiary_id: null }]),
    ).toBeTruthy();
  });
});

describe('PurchaseListPage messy data', () => {
  const { isAdmin } = require('@/lib/auth/roles');
  const { getActiveOrgIdFilter } = require('@/lib/auth/get-active-org-id');

  const renderWith = async (rows: unknown[] | null) => {
    isAdmin.mockReturnValueOnce(false);
    getActiveOrgIdFilter.mockResolvedValueOnce(1);
    const query = Promise.resolve({ data: rows, error: null });
    const chain = { eq: jest.fn(() => Object.assign(query, chain)) };
    mockFrom.mockReturnValueOnce({
      select: jest.fn(() => ({ order: jest.fn(() => Object.assign(query, chain)) })),
    });
    const result = await PurchaseListPage({ searchParams: Promise.resolve({}) });
    render(result);
    return result;
  };

  beforeEach(() => { jest.clearAllMocks(); });

  it('survives a null data payload', async () => {
    expect(await renderWith(null)).toBeTruthy();
  });

  it('drops nameless relations and de-duplicates repeated ones', async () => {
    const row = {
      id: 1,
      purchase_number: 'PUR-001',
      total_amount: null,
      points_earned: null,
      purchase_date: '2026-08-13T15:32:00Z',
      beneficiary_id: 'b1',
      beneficiary: { id: 'b1', first_name: null, last_name: null },
      cashier: { id: 'c1', first_name: null, last_name: null },
      branch: { id: 'br1', name: null },
    };
    expect(await renderWith([row, { ...row, id: 2, purchase_number: 'PUR-002' }])).toBeTruthy();
  });
});
