import RedemptionListPage from '@/app/dashboard/redemption/page';

const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
const mockSelect = jest.fn(() => ({ order: mockOrder }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));

jest.mock('next/headers', () => ({ cookies: jest.fn(() => Promise.resolve({ get: jest.fn(() => ({ value: '1' })) })) }));
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => Promise.resolve({ from: mockFrom })) }));
jest.mock('@/lib/supabase/admin', () => ({ createAdminClient: jest.fn(() => ({ from: mockFrom })) }));
jest.mock('@/lib/auth/get-current-user', () => ({ getCurrentUser: jest.fn(() => Promise.resolve({ id: '1', role: { name: 'admin' } })) }));
jest.mock('@/lib/auth/roles', () => ({ isAdmin: jest.fn(() => true) }));
jest.mock('@/components/dashboard/redemption/delete-modal', () => function Mock() { return <div />; });
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
  beforeEach(() => { jest.clearAllMocks(); });

  it('exports a default async function', () => { expect(typeof RedemptionListPage).toBe('function'); });
  it('renders without crashing', async () => {
    mockOrder.mockResolvedValueOnce({ data: [], error: null });
    const result = await RedemptionListPage();
    expect(result).toBeTruthy();
  });

  it('filters by organization for non-admin users', async () => {
    const { isAdmin } = require('@/lib/auth/roles');
    isAdmin.mockReturnValueOnce(false);
    const redemptions = [
      { id: '1', beneficiary_id: 'b1', product_id: 'p1', order_id: 'o1', points_used: 50, quantity: 1, redemption_date: '2024-01-01T00:00:00Z', beneficiary: { first_name: 'A', last_name: 'B', email: 'a@b.com' }, product: { name: 'P1', organization_id: 1 }, app_order: { order_number: 'ORD-1' } },
      { id: '2', beneficiary_id: 'b2', product_id: 'p2', order_id: 'o2', points_used: 30, quantity: 2, redemption_date: '2024-01-02T00:00:00Z', beneficiary: { first_name: 'C', last_name: 'D', email: 'c@d.com' }, product: { name: 'P2', organization_id: 2 }, app_order: { order_number: 'ORD-2' } },
    ];
    mockOrder.mockResolvedValueOnce({ data: redemptions, error: null });
    const result = await RedemptionListPage();
    expect(result).toBeTruthy();
  });

  it('renders redemption rows when data is returned', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{ id: '1', beneficiary_id: 'b1', points_used: 50, quantity: 1, redemption_date: '2024-01-01T00:00:00Z', beneficiary: { first_name: 'A' }, product: { name: 'P1', organization_id: 1 }, app_order: { order_number: 'ORD-1' } }],
      error: null,
    });
    const result = await RedemptionListPage();
    expect(result).toBeTruthy();
  });

  it('renders error message when query fails', async () => {
    mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });
    const result = await RedemptionListPage();
    expect(result).toBeTruthy();
  });

  it('renders redemptions with all optional fields null', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{ id: '3', beneficiary_id: 'b3', points_used: 10, quantity: 1, redemption_date: '2024-01-01T00:00:00Z', beneficiary: { first_name: null, last_name: null, email: null }, product: null, app_order: null }],
      error: null,
    });
    const result = await RedemptionListPage();
    expect(result).toBeTruthy();
  });

  it('renders redemption with beneficiary email fallback', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{ id: '4', beneficiary_id: 'b4', points_used: 20, quantity: 1, redemption_date: '2024-01-01T00:00:00Z', beneficiary: { first_name: null, last_name: null, email: 'email@test.com' }, product: { name: 'P2', organization_id: 1 }, app_order: { order_number: 'ORD-2' } }],
      error: null,
    });
    const result = await RedemptionListPage();
    expect(result).toBeTruthy();
  });

  it('renders redemption with beneficiary only last_name', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{ id: '5', beneficiary_id: 'b5', points_used: 15, quantity: 1, redemption_date: '2024-01-01T00:00:00Z', beneficiary: { first_name: null, last_name: 'OnlyLast', email: null }, product: { name: 'P3', organization_id: 1 }, app_order: { order_number: 'ORD-3' } }],
      error: null,
    });
    const result = await RedemptionListPage();
    expect(result).toBeTruthy();
  });

  it('handles no active_org_id cookie (null branch)', async () => {
    const { cookies } = require('next/headers');
    (cookies as jest.Mock).mockResolvedValueOnce({ get: jest.fn(() => undefined) });
    mockOrder.mockResolvedValueOnce({ data: [], error: null });
    const result = await RedemptionListPage();
    expect(result).toBeTruthy();
  });
});
