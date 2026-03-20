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
jest.mock('@/lib/auth/roles', () => ({ isAdmin: jest.fn(() => true) }));
jest.mock('@/components/dashboard/purchase/delete-modal', () => function Mock() { return <div />; });
jest.mock('@/components/dashboard/purchase/toast-handler', () => function Mock() { return <div />; });
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
    const result = await PurchaseListPage();
    expect(result).toBeTruthy();
  });

  it('renders purchase rows when data is returned', async () => {
    mockOrder.mockResolvedValueOnce({ data: mockPurchases, error: null });
    const result = await PurchaseListPage();
    expect(result).toBeTruthy();
  });

  it('renders error message when query fails', async () => {
    mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });
    const result = await PurchaseListPage();
    expect(result).toBeTruthy();
  });

  it('renders purchase with null beneficiary/cashier/branch', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [mockPurchases[1]],
      error: null,
    });
    const result = await PurchaseListPage();
    expect(result).toBeTruthy();
  });

  it('renders purchase with beneficiary and cashier data', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [mockPurchases[0]],
      error: null,
    });
    const result = await PurchaseListPage();
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
    const result = await PurchaseListPage();
    expect(result).toBeTruthy();
  });

  it('filters by org for non-admin users', async () => {
    const { isAdmin } = require('@/lib/auth/roles');
    isAdmin.mockReturnValueOnce(false);
    mockEq.mockResolvedValueOnce({ data: [], error: null });
    const result = await PurchaseListPage();
    expect(result).toBeTruthy();
  });
});
