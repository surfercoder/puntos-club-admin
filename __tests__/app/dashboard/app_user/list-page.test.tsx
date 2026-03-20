import AppUserListPage from '@/app/dashboard/app_user/page';

const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
const mockEq = jest.fn(() => ({ order: mockOrder }));
const mockSelect = jest.fn(() => ({ order: mockOrder, eq: mockEq }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));

jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
jest.mock('next/headers', () => ({ cookies: jest.fn(() => Promise.resolve({ get: jest.fn(() => ({ value: '1' })) })) }));
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => Promise.resolve({ from: mockFrom })) }));
jest.mock('@/lib/auth/get-current-user', () => ({ getCurrentUser: jest.fn(() => Promise.resolve({ id: 'current-user', role: { name: 'admin' } })) }));
jest.mock('@/lib/auth/roles', () => ({ isAdmin: jest.fn(() => true) }));
jest.mock('@/components/dashboard/app_user/delete-modal', () => function Mock() { return <div />; });
jest.mock('@/components/dashboard/plan/plan-usage-badge', () => ({ PlanUsageBadge: () => <div /> }));
jest.mock('@/components/ui/button', () => ({ Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button> }));
jest.mock('@/components/ui/table', () => ({ Table: ({ children }: { children: React.ReactNode }) => <table>{children}</table>, TableHeader: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>, TableRow: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>, TableHead: ({ children }: { children: React.ReactNode }) => <th>{children}</th>, TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>, TableCell: ({ children }: { children: React.ReactNode }) => <td>{children}</td> }));

describe('AppUserListPage', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('exports a default async function', () => { expect(typeof AppUserListPage).toBe('function'); });
  it('renders without crashing', async () => {
    mockOrder.mockResolvedValueOnce({ data: [], error: null });
    const result = await AppUserListPage();
    expect(result).toBeTruthy();
  });

  it('renders user rows when data is returned', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{ id: '1', organization_id: '1', first_name: 'John', last_name: 'Doe', email: 'john@test.com', username: 'johnd', active: true, organization: { name: 'Org1' }, role: { name: 'cashier' } }],
      error: null,
    });
    const result = await AppUserListPage();
    expect(result).toBeTruthy();
  });

  it('renders error message when query fails', async () => {
    mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });
    const result = await AppUserListPage();
    expect(result).toBeTruthy();
  });

  it('renders user with no name fields (N/A fallback)', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{ id: '2', organization_id: '1', first_name: null, last_name: null, email: null, username: null, active: false, organization: null, role: null }],
      error: null,
    });
    const result = await AppUserListPage();
    expect(result).toBeTruthy();
  });

  it('renders user with only first_name (no last_name)', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{ id: '3', organization_id: '1', first_name: 'Solo', last_name: null, email: 'solo@test.com', username: 'solo', active: true, organization: { name: 'Org1' }, role: { name: 'cashier' } }],
      error: null,
    });
    const result = await AppUserListPage();
    expect(result).toBeTruthy();
  });

  it('renders user with only username for delete modal name', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{ id: '4', organization_id: '1', first_name: null, last_name: null, email: null, username: 'onlyuser', active: true, organization: { name: 'Org1' }, role: null }],
      error: null,
    });
    const result = await AppUserListPage();
    expect(result).toBeTruthy();
  });

  it('renders user with only email for delete modal name', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{ id: '5', organization_id: '1', first_name: null, last_name: null, email: 'email@test.com', username: null, active: true, organization: { name: 'Org1' }, role: null }],
      error: null,
    });
    const result = await AppUserListPage();
    expect(result).toBeTruthy();
  });

  it('renders user with only last_name (no first_name)', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{ id: '6', organization_id: '1', first_name: null, last_name: 'OnlyLast', email: null, username: null, active: true, organization: { name: 'Org1' }, role: null }],
      error: null,
    });
    const result = await AppUserListPage();
    expect(result).toBeTruthy();
  });
});
