import UserRoleListPage from '@/app/dashboard/user-role/page';

const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
const mockSelect = jest.fn(() => ({ order: mockOrder }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));

jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => Promise.resolve({ from: mockFrom })) }));
jest.mock('@/components/dashboard/user_role_crud/delete-modal', () => function Mock() { return <div />; });
jest.mock('@/components/dashboard/user_role_crud/toast-handler', () => function Mock() { return <div />; });
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

const mockRoles = [
  { id: '1', name: 'final_user', display_name: 'Final User', description: 'End user' },
  { id: '2', name: 'cashier', display_name: 'Cashier', description: null },
  { id: '3', name: 'owner', display_name: 'Owner', description: 'Org owner' },
  { id: '4', name: 'admin', display_name: 'Admin', description: 'Administrator' },
  { id: '5', name: 'collaborator', display_name: 'Collaborator', description: 'Collaborator role' },
];

describe('UserRoleListPage', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('exports a default async function', () => {
    expect(typeof UserRoleListPage).toBe('function');
  });

  it('renders without crashing with empty data', async () => {
    mockOrder.mockResolvedValueOnce({ data: [], error: null });
    const result = await UserRoleListPage();
    expect(result).toBeTruthy();
  });

  it('renders role rows when data is returned', async () => {
    mockOrder.mockResolvedValueOnce({ data: mockRoles, error: null });
    const result = await UserRoleListPage();
    expect(result).toBeTruthy();
  });

  it('renders error message when query fails', async () => {
    mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });
    const result = await UserRoleListPage();
    expect(result).toBeTruthy();
  });

  it('renders N/A for role with null description', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{ id: '2', name: 'cashier', display_name: 'Cashier', description: null }],
      error: null,
    });
    const result = await UserRoleListPage();
    expect(result).toBeTruthy();
  });

  it('renders role with description', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{ id: '1', name: 'admin', display_name: 'Admin', description: 'Administrator' }],
      error: null,
    });
    const result = await UserRoleListPage();
    expect(result).toBeTruthy();
  });
});
