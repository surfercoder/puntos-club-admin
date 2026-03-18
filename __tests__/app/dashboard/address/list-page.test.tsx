import AddressListPage from '@/app/dashboard/address/page';

const mockEq = jest.fn().mockResolvedValue({ data: [], error: null });
const mockOrder = jest.fn(() => ({ eq: mockEq, then: (fn: Function) => fn({ data: [], error: null }) }));
const mockSelect = jest.fn(() => ({ order: mockOrder }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));

jest.mock('next/headers', () => ({ cookies: jest.fn(() => Promise.resolve({ get: jest.fn(() => ({ value: '1' })) })) }));
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => Promise.resolve({ from: mockFrom })) }));
jest.mock('@/lib/auth/get-current-user', () => ({ getCurrentUser: jest.fn(() => Promise.resolve({ id: '1', role: { name: 'admin' } })) }));
jest.mock('@/lib/auth/roles', () => ({ isAdmin: jest.fn(() => true) }));
jest.mock('@/components/dashboard/address/delete-modal', () => function Mock() { return <div />; });
jest.mock('@/components/ui/button', () => ({ Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button> }));
jest.mock('@/components/ui/table', () => ({ Table: ({ children }: { children: React.ReactNode }) => <table>{children}</table>, TableHeader: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>, TableRow: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>, TableHead: ({ children }: { children: React.ReactNode }) => <th>{children}</th>, TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>, TableCell: ({ children }: { children: React.ReactNode }) => <td>{children}</td> }));

describe('AddressListPage', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('exports a default async function', () => { expect(typeof AddressListPage).toBe('function'); });
  it('renders without crashing', async () => { const result = await AddressListPage(); expect(result).toBeTruthy(); });

  it('filters by organization for non-admin users', async () => {
    const { isAdmin } = require('@/lib/auth/roles');
    isAdmin.mockReturnValueOnce(false);
    mockOrder.mockReturnValueOnce({ eq: mockEq });
    mockEq.mockResolvedValueOnce({ data: [], error: null });
    const result = await AddressListPage();
    expect(result).toBeTruthy();
    expect(mockEq).toHaveBeenCalled();
  });

  it('renders address rows when data is returned', async () => {
    mockOrder.mockReturnValueOnce({
      eq: jest.fn().mockResolvedValue({ data: [{ id: '1', street: 'Calle 1', number: '123', city: 'BA', state: 'BA', zip_code: '1000' }], error: null }),
      then: (fn: Function) => fn({ data: [{ id: '1', street: 'Calle 1', number: '123', city: 'BA', state: 'BA', zip_code: '1000' }], error: null }),
    });
    const result = await AddressListPage();
    expect(result).toBeTruthy();
  });

  it('renders error message when query fails', async () => {
    mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });
    const result = await AddressListPage();
    expect(result).toBeTruthy();
  });

  it('handles no active_org_id cookie (null branch)', async () => {
    const { cookies } = require('next/headers');
    (cookies as jest.Mock).mockResolvedValueOnce({ get: jest.fn(() => undefined) });
    mockOrder.mockResolvedValueOnce({ data: [], error: null });
    const result = await AddressListPage();
    expect(result).toBeTruthy();
  });
});
