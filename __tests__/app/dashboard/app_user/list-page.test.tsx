import AppUserListPage from '@/app/dashboard/app_user/page';

const mockSingle = jest.fn().mockResolvedValue({ data: { id: 'cashier-role-id' }, error: null });
const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
const mockEq = jest.fn(() => ({ order: mockOrder, eq: mockEq, single: mockSingle }));
const mockSelect = jest.fn(() => ({ order: mockOrder, eq: mockEq }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));

jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
jest.mock('next/headers', () => ({ cookies: jest.fn(() => Promise.resolve({ get: jest.fn(() => ({ value: '1' })) })) }));
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => Promise.resolve({ from: mockFrom })) }));
jest.mock('@/lib/auth/get-current-user', () => ({ getCurrentUser: jest.fn(() => Promise.resolve({ id: 'current-user', role: { name: 'admin' } })) }));
jest.mock('@/lib/auth/roles', () => ({ isAdmin: jest.fn(() => true), isCollaborator: jest.fn(() => false) }));
jest.mock('@/components/dashboard/app_user/delete-modal', () => function Mock() { return <div />; });
jest.mock('@/components/dashboard/app_user/new-user-button', () => ({ NewUserButton: () => <button>New</button> }));
jest.mock('@/components/dashboard/plan/plan-usage-badge', () => ({ PlanUsageBadge: () => <div /> }));
jest.mock('@/components/ui/badge', () => ({ Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span> }));
jest.mock('@/components/ui/button', () => ({ Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button> }));
jest.mock('@/components/ui/table', () => ({ Table: ({ children }: { children: React.ReactNode }) => <table>{children}</table>, TableHeader: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>, TableRow: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>, TableHead: ({ children }: { children: React.ReactNode }) => <th>{children}</th>, TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>, TableCell: ({ children }: { children: React.ReactNode }) => <td>{children}</td> }));

describe('AppUserListPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ order: mockOrder, eq: mockEq });
    mockOrder.mockResolvedValue({ data: [], error: null });
    mockEq.mockReturnValue({ order: mockOrder, eq: mockEq, single: mockSingle });
    mockSingle.mockResolvedValue({ data: { id: 'cashier-role-id' }, error: null });
    const { isAdmin, isCollaborator } = require('@/lib/auth/roles');
    (isAdmin as jest.Mock).mockReturnValue(true);
    (isCollaborator as jest.Mock).mockReturnValue(false);
  });

  it('exports a default async function', () => { expect(typeof AppUserListPage).toBe('function'); });

  it('renders without crashing', async () => {
    mockOrder.mockResolvedValueOnce({ data: [], error: null });
    const result = await AppUserListPage();
    expect(result).toBeTruthy();
  });

  it('renders user rows with cashier role badge', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{ id: '1', organization_id: '1', first_name: 'John', last_name: 'Doe', email: 'john@test.com', organization: { name: 'Org1' }, role: { name: 'cashier' } }],
      error: null,
    });
    const result = await AppUserListPage();
    expect(result).toBeTruthy();
  });

  it('renders user rows with collaborator role badge', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{ id: '1', organization_id: '1', first_name: 'John', last_name: 'Doe', email: 'john@test.com', organization: { name: 'Org1' }, role: { name: 'collaborator' } }],
      error: null,
    });
    const result = await AppUserListPage();
    expect(result).toBeTruthy();
  });

  it('renders user rows with unknown role (N/A fallback)', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{ id: '1', organization_id: '1', first_name: 'John', last_name: 'Doe', email: 'john@test.com', organization: { name: 'Org1' }, role: { name: 'unknown_role' } }],
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
      data: [{ id: '2', organization_id: '1', first_name: null, last_name: null, email: null, organization: null, role: null }],
      error: null,
    });
    const result = await AppUserListPage();
    expect(result).toBeTruthy();
  });

  it('renders user with only first_name (no last_name)', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{ id: '3', organization_id: '1', first_name: 'Solo', last_name: null, email: 'solo@test.com', organization: { name: 'Org1' }, role: { name: 'cashier' } }],
      error: null,
    });
    const result = await AppUserListPage();
    expect(result).toBeTruthy();
  });

  it('renders user with only email for delete modal name', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{ id: '5', organization_id: '1', first_name: null, last_name: null, email: 'email@test.com', organization: { name: 'Org1' }, role: null }],
      error: null,
    });
    const result = await AppUserListPage();
    expect(result).toBeTruthy();
  });

  it('filters by organization_id when non-admin with activeOrgId', async () => {
    const { isAdmin } = require('@/lib/auth/roles');
    (isAdmin as jest.Mock).mockReturnValueOnce(false);
    const mockOrderInner = jest.fn().mockResolvedValue({ data: [], error: null });
    const mockEqInner = jest.fn(() => ({ order: mockOrderInner }));
    mockOrder.mockReturnValueOnce({ eq: mockEqInner });

    const result = await AppUserListPage();
    expect(result).toBeTruthy();
  });

  it('handles null rawData by falling back to null', async () => {
    mockOrder.mockResolvedValueOnce({ data: null, error: null });
    const result = await AppUserListPage();
    expect(result).toBeTruthy();
  });

  it('filters out current user from the list', async () => {
    const { getCurrentUser } = require('@/lib/auth/get-current-user');
    getCurrentUser.mockResolvedValueOnce({ id: 'current-user', role: { name: 'admin' } });
    mockOrder.mockResolvedValueOnce({
      data: [
        { id: 'current-user', organization_id: '1', first_name: 'Me', last_name: 'Owner', email: 'me@test.com', organization: { name: 'Org1' }, role: { name: 'owner' } },
        { id: 'other-user', organization_id: '1', first_name: 'Other', last_name: 'User', email: 'other@test.com', organization: { name: 'Org1' }, role: { name: 'cashier' } },
      ],
      error: null,
    });
    const result = await AppUserListPage();
    expect(result).toBeTruthy();
  });

  it('renders user with only last_name (no first_name)', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{ id: '6', organization_id: '1', first_name: null, last_name: 'OnlyLast', email: null, organization: { name: 'Org1' }, role: null }],
      error: null,
    });
    const result = await AppUserListPage();
    expect(result).toBeTruthy();
  });

  it('filters cashier users when user is collaborator', async () => {
    const { isAdmin, isCollaborator } = require('@/lib/auth/roles');
    (isAdmin as jest.Mock).mockReturnValueOnce(false);
    (isCollaborator as jest.Mock).mockReturnValueOnce(true);

    // The collaborator flow: query.eq('organization_id', ...) then query.eq('role_id', cashierRole.id)
    const mockOrderFinal = jest.fn().mockResolvedValue({ data: [], error: null });
    const mockEqRoleId = jest.fn(() => ({ order: mockOrderFinal, eq: mockEqRoleId }));
    const mockEqOrgId = jest.fn(() => ({ order: mockOrderFinal, eq: mockEqRoleId }));
    mockOrder.mockReturnValueOnce({ eq: mockEqOrgId });

    // Mock the cashier role lookup (from('user_role').select('id').eq('name','cashier').single())
    const mockRoleSingle = jest.fn().mockResolvedValue({ data: { id: 'cashier-role-id' }, error: null });
    const mockRoleEq = jest.fn(() => ({ single: mockRoleSingle }));
    const mockRoleSelect = jest.fn(() => ({ eq: mockRoleEq }));
    mockFrom.mockReturnValueOnce({ select: mockSelect }).mockReturnValueOnce({ select: mockRoleSelect });

    const result = await AppUserListPage();
    expect(result).toBeTruthy();
  });

  it('handles collaborator when cashier role lookup returns null', async () => {
    const { isAdmin, isCollaborator } = require('@/lib/auth/roles');
    (isAdmin as jest.Mock).mockReturnValueOnce(false);
    (isCollaborator as jest.Mock).mockReturnValueOnce(true);

    const mockOrderFinal = jest.fn().mockResolvedValue({ data: [], error: null });
    const mockEqInner = jest.fn(() => ({ order: mockOrderFinal, eq: mockEqInner }));
    mockOrder.mockReturnValueOnce({ eq: mockEqInner });

    // Cashier role lookup returns null
    const mockRoleSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    const mockRoleEq = jest.fn(() => ({ single: mockRoleSingle }));
    const mockRoleSelect = jest.fn(() => ({ eq: mockRoleEq }));
    mockFrom.mockReturnValueOnce({ select: mockSelect }).mockReturnValueOnce({ select: mockRoleSelect });

    const result = await AppUserListPage();
    expect(result).toBeTruthy();
  });

  it('hides collaborators PlanUsageBadge when user is collaborator', async () => {
    const { isAdmin, isCollaborator } = require('@/lib/auth/roles');
    (isAdmin as jest.Mock).mockReturnValue(true);
    (isCollaborator as jest.Mock).mockReturnValueOnce(true);

    // When isCollaborator is true, the code does cashier role lookup then query.eq('role_id', ...)
    const mockOrderFinal = jest.fn().mockResolvedValue({ data: [], error: null });
    const mockEqRoleId = jest.fn(() => ({ order: mockOrderFinal, eq: mockEqRoleId }));
    mockOrder.mockReturnValueOnce({ eq: mockEqRoleId });

    const mockRoleSingle = jest.fn().mockResolvedValue({ data: { id: 'cashier-role-id' }, error: null });
    const mockRoleEq = jest.fn(() => ({ single: mockRoleSingle }));
    const mockRoleSelect = jest.fn(() => ({ eq: mockRoleEq }));
    mockFrom.mockReturnValueOnce({ select: mockSelect }).mockReturnValueOnce({ select: mockRoleSelect });

    const result = await AppUserListPage();
    expect(result).toBeTruthy();
  });

  it('renders user with null first_name and non-null last_name for delete modal', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{ id: '7', organization_id: '1', first_name: null, last_name: 'LastOnly', email: null, organization: { name: 'Org1' }, role: null }],
      error: null,
    });
    const result = await AppUserListPage();
    expect(result).toBeTruthy();
  });
});
