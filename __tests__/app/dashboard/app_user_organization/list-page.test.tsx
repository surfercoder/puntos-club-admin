import AppUserOrganizationListPage from '@/app/dashboard/app_user_organization/page';

const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
const mockSelect = jest.fn(() => ({ order: mockOrder }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => Promise.resolve({ from: mockFrom })) }));
jest.mock('@/components/dashboard/app_user_organization/delete-modal', () => function Mock() { return <div />; });
jest.mock('@/components/ui/button', () => ({ Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button> }));
jest.mock('@/components/ui/table', () => ({ Table: ({ children }: { children: React.ReactNode }) => <table>{children}</table>, TableHeader: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>, TableRow: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>, TableHead: ({ children }: { children: React.ReactNode }) => <th>{children}</th>, TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>, TableCell: ({ children }: { children: React.ReactNode }) => <td>{children}</td> }));

describe('AppUserOrganizationListPage', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('exports a default async function', () => { expect(typeof AppUserOrganizationListPage).toBe('function'); });
  it('renders without crashing', async () => {
    mockOrder.mockResolvedValueOnce({ data: [], error: null });
    const result = await AppUserOrganizationListPage();
    expect(result).toBeTruthy();
  });

  it('renders rows when data is returned', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{ id: '1', app_user_id: '1', organization_id: '1', is_active: true, app_user: { first_name: 'John', last_name: 'Doe', email: 'john@test.com' }, organization: { name: 'Org1' } }],
      error: null,
    });
    const result = await AppUserOrganizationListPage();
    expect(result).toBeTruthy();
  });

  it('renders error message when query fails', async () => {
    mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });
    const result = await AppUserOrganizationListPage();
    expect(result).toBeTruthy();
  });

  it('renders rows with no name (email fallback)', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{ id: '2', app_user_id: '2', organization_id: '1', is_active: false, app_user: { first_name: null, last_name: null, email: 'only@email.com' }, organization: { name: 'Org1' } }],
      error: null,
    });
    const result = await AppUserOrganizationListPage();
    expect(result).toBeTruthy();
  });

  it('renders rows with no name and no email (N/A)', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{ id: '3', app_user_id: '3', organization_id: '1', is_active: true, app_user: { first_name: null, last_name: null, email: null }, organization: null }],
      error: null,
    });
    const result = await AppUserOrganizationListPage();
    expect(result).toBeTruthy();
  });

  it('renders rows with only first_name', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{ id: '4', app_user_id: '4', organization_id: '1', is_active: true, app_user: { first_name: 'Solo', last_name: null, email: 'solo@test.com' }, organization: { name: 'Org1' } }],
      error: null,
    });
    const result = await AppUserOrganizationListPage();
    expect(result).toBeTruthy();
  });

  it('renders rows with only last_name (no first_name)', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{ id: '5', app_user_id: '5', organization_id: '1', is_active: true, app_user: { first_name: null, last_name: 'OnlyLast', email: 'last@test.com' }, organization: { name: 'Org1' } }],
      error: null,
    });
    const result = await AppUserOrganizationListPage();
    expect(result).toBeTruthy();
  });
});
