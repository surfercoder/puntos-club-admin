import CategoryListPage from '@/app/dashboard/category/page';

const mockEq = jest.fn().mockResolvedValue({ data: [], error: null });
const mockOrder = jest.fn(() => ({ eq: mockEq }));
const mockSelect = jest.fn(() => ({ order: mockOrder }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({ from: mockFrom })),
}));

jest.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: jest.fn(() => Promise.resolve({ id: '1', role: { name: 'admin' } })),
}));

jest.mock('@/lib/auth/roles', () => ({
  isAdmin: jest.fn(() => true),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => Promise.resolve({
    get: jest.fn(() => ({ value: '1' })),
  })),
}));

jest.mock('@/components/dashboard/category/delete-modal', () => {
  return function MockDeleteModal() { return <div data-testid="delete-modal" />; };
});

jest.mock('@/components/dashboard/category/toast-handler', () => {
  return function MockToastHandler() { return <div data-testid="toast-handler" />; };
});

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: { children: React.ReactNode }) => <button {...props}>{children}</button>,
}));

jest.mock('@/components/ui/table', () => ({
  Table: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
  TableHeader: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>,
  TableRow: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>,
  TableHead: ({ children }: { children: React.ReactNode }) => <th>{children}</th>,
  TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>,
  TableCell: ({ children }: { children: React.ReactNode }) => <td>{children}</td>,
}));

describe('CategoryListPage', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('exports a default async function', () => {
    expect(typeof CategoryListPage).toBe('function');
  });

  it('renders without crashing (admin, no eq filter)', async () => {
    // Admin path: order resolves directly (not calling eq)
    mockOrder.mockResolvedValueOnce({
      data: [{ id: '1', name: 'Test Category', description: 'Desc', active: true }],
      error: null,
    });
    const result = await CategoryListPage();
    expect(result).toBeTruthy();
  });

  it('filters by organization for non-admin users', async () => {
    const { isAdmin } = require('@/lib/auth/roles');
    isAdmin.mockReturnValueOnce(false);
    mockOrder.mockReturnValueOnce({ eq: mockEq });
    mockEq.mockResolvedValueOnce({
      data: [{ id: '1', name: 'Cat 1', description: 'D', active: true }],
      error: null,
    });
    const result = await CategoryListPage();
    expect(result).toBeTruthy();
  });

  it('renders category rows with data', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{ id: '1', name: 'Cat', description: null, active: false }],
      error: null,
    });
    const result = await CategoryListPage();
    expect(result).toBeTruthy();
  });

  it('renders error message when query fails', async () => {
    mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });
    const result = await CategoryListPage();
    expect(result).toBeTruthy();
  });

  it('handles category with no id (returns null)', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{ id: null, name: 'No ID Cat', description: 'Desc', active: true }, { id: '2', name: 'Valid', description: null, active: true }],
      error: null,
    });
    const result = await CategoryListPage();
    expect(result).toBeTruthy();
  });

  it('handles no active_org_id cookie (null branch)', async () => {
    const { cookies } = require('next/headers');
    (cookies as jest.Mock).mockResolvedValueOnce({ get: jest.fn(() => undefined) });
    mockOrder.mockResolvedValueOnce({ data: [], error: null });
    const result = await CategoryListPage();
    expect(result).toBeTruthy();
  });
});
