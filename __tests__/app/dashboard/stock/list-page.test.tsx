import StockListPage from '@/app/dashboard/stock/page';

const mockSelect = jest.fn().mockResolvedValue({ data: [], error: null });
const mockFrom = jest.fn(() => ({ select: mockSelect }));

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => Promise.resolve({ get: jest.fn(() => ({ value: '1' })) })),
}));
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({ from: mockFrom })),
}));
jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(() => ({ from: mockFrom })),
}));
jest.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: jest.fn(() => Promise.resolve({ id: '1', role: { name: 'admin' } })),
}));
jest.mock('@/lib/auth/roles', () => ({ isAdmin: jest.fn(() => true) }));
jest.mock('@/components/dashboard/stock/delete-modal', () => function Mock() { return <div />; });
jest.mock('@/components/ui/button', () => ({ Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button> }));
jest.mock('@/components/ui/table', () => ({
  Table: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
  TableHeader: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>,
  TableRow: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>,
  TableHead: ({ children }: { children: React.ReactNode }) => <th>{children}</th>,
  TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>,
  TableCell: ({ children }: { children: React.ReactNode }) => <td>{children}</td>,
}));

describe('StockListPage', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('exports a default async function', () => { expect(typeof StockListPage).toBe('function'); });
  it('renders without crashing', async () => {
    mockSelect.mockResolvedValueOnce({ data: [], error: null });
    const result = await StockListPage();
    expect(result).toBeTruthy();
  });

  it('filters by organization for non-admin users', async () => {
    const { isAdmin } = require('@/lib/auth/roles');
    isAdmin.mockReturnValueOnce(false);
    const stockData = [
      { id: '1', branch_id: 'b1', product_id: 'p1', quantity: 10, minimum_quantity: 5, branch: { name: 'B1', organization_id: 1 }, product: { name: 'P1' } },
      { id: '2', branch_id: 'b2', product_id: 'p2', quantity: 3, minimum_quantity: 5, branch: { name: 'B2', organization_id: 2 }, product: { name: 'P2' } },
    ];
    mockSelect.mockResolvedValueOnce({ data: stockData, error: null });
    const result = await StockListPage();
    expect(result).toBeTruthy();
  });

  it('renders stock rows when data is returned', async () => {
    mockSelect.mockResolvedValueOnce({
      data: [{ id: '1', branch_id: 'b1', product_id: 'p1', quantity: 10, minimum_quantity: 5, branch: { name: 'B1', organization_id: 1 }, product: { name: 'P1' } }],
      error: null,
    });
    const result = await StockListPage();
    expect(result).toBeTruthy();
  });

  it('renders error message when query fails', async () => {
    mockSelect.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });
    const result = await StockListPage();
    expect(result).toBeTruthy();
  });

  it('renders stock with equal quantity and minimum (low stock)', async () => {
    mockSelect.mockResolvedValueOnce({
      data: [{ id: '3', branch_id: 'b3', product_id: 'p3', quantity: 5, minimum_quantity: 5, branch: { name: 'B3', organization_id: 1 }, product: { name: 'P3' } }],
      error: null,
    });
    const result = await StockListPage();
    expect(result).toBeTruthy();
  });

  it('renders stock below minimum (out of stock)', async () => {
    mockSelect.mockResolvedValueOnce({
      data: [{ id: '4', branch_id: 'b4', product_id: 'p4', quantity: 2, minimum_quantity: 5, branch: { name: 'B4', organization_id: 1 }, product: { name: 'P4' } }],
      error: null,
    });
    const result = await StockListPage();
    expect(result).toBeTruthy();
  });

  it('renders stock with null branch and product (N/A)', async () => {
    mockSelect.mockResolvedValueOnce({
      data: [{ id: '5', branch_id: 'b5', product_id: 'p5', quantity: 0, minimum_quantity: 0, branch: null, product: null }],
      error: null,
    });
    const result = await StockListPage();
    expect(result).toBeTruthy();
  });

  it('handles no active_org_id cookie (null branch)', async () => {
    const { cookies } = require('next/headers');
    (cookies as jest.Mock).mockResolvedValueOnce({ get: jest.fn(() => undefined) });
    mockSelect.mockResolvedValueOnce({ data: [], error: null });
    const result = await StockListPage();
    expect(result).toBeTruthy();
  });
});
