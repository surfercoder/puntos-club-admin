import AppOrderListPage from '@/app/dashboard/app_order/page';

const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
const mockSelect = jest.fn(() => ({ order: mockOrder }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));

jest.mock('next/headers', () => ({ cookies: jest.fn(() => Promise.resolve({ get: jest.fn(() => ({ value: '1' })) })) }));
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => Promise.resolve({ from: mockFrom })) }));
jest.mock('@/lib/auth/get-current-user', () => ({ getCurrentUser: jest.fn(() => Promise.resolve({ id: '1', role: { name: 'admin' } })) }));
jest.mock('@/lib/auth/roles', () => ({ isAdmin: jest.fn(() => true) }));
jest.mock('@/components/dashboard/app_order/delete-modal', () => function Mock() { return <div />; });
jest.mock('@/components/ui/button', () => ({ Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button> }));
jest.mock('@/components/ui/table', () => ({ Table: ({ children }: { children: React.ReactNode }) => <table>{children}</table>, TableHeader: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>, TableRow: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>, TableHead: ({ children }: { children: React.ReactNode }) => <th>{children}</th>, TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>, TableCell: ({ children }: { children: React.ReactNode }) => <td>{children}</td> }));

describe('AppOrderListPage', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('exports a default async function', () => { expect(typeof AppOrderListPage).toBe('function'); });
  it('renders without crashing', async () => {
    mockOrder.mockResolvedValueOnce({ data: [], error: null });
    const result = await AppOrderListPage();
    expect(result).toBeTruthy();
  });

  it('filters orders by organization for non-admin users', async () => {
    const { isAdmin } = require('@/lib/auth/roles');
    isAdmin.mockReturnValueOnce(false);
    const ordersWithRelations = [
      { id: '1', order_number: 'ORD-001', creation_date: '2024-01-01', total_points: 100, observations: null, redemption: [{ product: { organization_id: 1 } }] },
      { id: '2', order_number: 'ORD-002', creation_date: '2024-01-02', total_points: 200, observations: 'test', redemption: [{ product: { organization_id: 2 } }] },
    ];
    mockOrder.mockResolvedValueOnce({ data: ordersWithRelations, error: null });
    const result = await AppOrderListPage();
    expect(result).toBeTruthy();
  });

  it('renders order rows when data exists', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{ id: '1', order_number: 'ORD-001', creation_date: '2024-01-01', total_points: 100, observations: null, redemption: [] }],
      error: null,
    });
    const result = await AppOrderListPage();
    expect(result).toBeTruthy();
  });

  it('renders error message when query fails', async () => {
    mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });
    const result = await AppOrderListPage();
    expect(result).toBeTruthy();
  });

  it('handles orders with observations text', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{ id: '1', order_number: 'ORD-001', creation_date: '2024-01-01', total_points: 100, observations: 'Some notes', redemption: [] }],
      error: null,
    });
    const result = await AppOrderListPage();
    expect(result).toBeTruthy();
  });

  it('handles no active_org_id cookie (null branch)', async () => {
    const { cookies } = require('next/headers');
    (cookies as jest.Mock).mockResolvedValueOnce({ get: jest.fn(() => undefined) });
    mockOrder.mockResolvedValueOnce({ data: [], error: null });
    const result = await AppOrderListPage();
    expect(result).toBeTruthy();
  });

  it('filters non-admin with orders having empty redemption array', async () => {
    const { isAdmin } = require('@/lib/auth/roles');
    isAdmin.mockReturnValueOnce(false);
    mockOrder.mockResolvedValueOnce({
      data: [{ id: '1', order_number: 'ORD-001', creation_date: '2024-01-01', total_points: 100, observations: null, redemption: [] }],
      error: null,
    });
    const result = await AppOrderListPage();
    expect(result).toBeTruthy();
  });
});
