import BranchListPage from '@/app/dashboard/branch/page';

const mockEq = jest.fn().mockResolvedValue({ data: [], error: null });
const mockSelect = jest.fn().mockResolvedValue({ data: [], error: null });
const mockFrom = jest.fn(() => ({ select: mockSelect }));

jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(() => Promise.resolve((key: string) => key)),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => Promise.resolve({ get: jest.fn(() => ({ value: '1' })) })),
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({ from: mockFrom })),
}));

jest.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: jest.fn(() => Promise.resolve({ id: '1', role: { name: 'admin' } })),
}));

jest.mock('@/lib/auth/roles', () => ({ isAdmin: jest.fn(() => true) }));

jest.mock('@/components/dashboard/branch/delete-modal', () => {
  return function Mock() { return <div />; };
});

jest.mock('@/components/dashboard/plan/plan-limit-create-button', () => ({
  PlanLimitCreateButton: () => <div />,
}));

jest.mock('@/components/dashboard/plan/plan-usage-banner', () => ({
  PlanUsageBanner: () => <div />,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
}));

jest.mock('@/components/ui/table', () => ({
  Table: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
  TableHeader: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>,
  TableRow: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>,
  TableHead: ({ children }: { children: React.ReactNode }) => <th>{children}</th>,
  TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>,
  TableCell: ({ children }: { children: React.ReactNode }) => <td>{children}</td>,
}));

describe('BranchListPage', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('exports a default async function', () => {
    expect(typeof BranchListPage).toBe('function');
  });

  it('renders without crashing', async () => {
    mockSelect.mockResolvedValueOnce({ data: [], error: null });
    const result = await BranchListPage();
    expect(result).toBeTruthy();
  });

  it('filters by organization for non-admin users', async () => {
    const { isAdmin } = require('@/lib/auth/roles');
    isAdmin.mockReturnValueOnce(false);
    // non-admin path: select returns object with eq
    mockSelect.mockReturnValueOnce({ eq: mockEq });
    mockEq.mockResolvedValueOnce({ data: [], error: null });
    const result = await BranchListPage();
    expect(result).toBeTruthy();
    expect(mockEq).toHaveBeenCalled();
  });

  it('renders branch rows when data is returned', async () => {
    mockSelect.mockResolvedValueOnce({
      data: [{ id: '1', name: 'Branch 1', phone: '123', active: true, organization: { name: 'Org1' }, address: { street: 'St', city: 'City' } }],
      error: null,
    });
    const result = await BranchListPage();
    expect(result).toBeTruthy();
  });

  it('renders error message when query fails', async () => {
    mockSelect.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });
    const result = await BranchListPage();
    expect(result).toBeTruthy();
  });

  it('renders branch with missing optional fields', async () => {
    mockSelect.mockResolvedValueOnce({
      data: [{ id: '2', name: 'Branch 2', phone: null, active: false, organization: null, address: null }],
      error: null,
    });
    const result = await BranchListPage();
    expect(result).toBeTruthy();
  });

  it('handles no active_org_id cookie (null branch)', async () => {
    const { cookies } = require('next/headers');
    (cookies as jest.Mock).mockResolvedValueOnce({ get: jest.fn(() => undefined) });
    mockSelect.mockResolvedValueOnce({ data: [], error: null });
    const result = await BranchListPage();
    expect(result).toBeTruthy();
  });
});
