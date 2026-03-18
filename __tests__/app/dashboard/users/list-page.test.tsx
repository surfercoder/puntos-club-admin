import { redirect } from 'next/navigation';
import UsersListPage from '@/app/dashboard/users/page';

jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
jest.mock('next/headers', () => ({ cookies: jest.fn(() => Promise.resolve({ get: jest.fn(() => ({ value: 'org-1' })) })) }));
jest.mock('@/actions/dashboard/user/actions', () => ({ getAllUsers: jest.fn(() => Promise.resolve([])) }));
jest.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: jest.fn(() => Promise.resolve({ id: '1', role: { name: 'admin' }, organization_id: '1' })),
}));
jest.mock('@/lib/auth/roles', () => ({ isAdmin: jest.fn(() => true), isOwner: jest.fn(() => false) }));
jest.mock('@/components/dashboard/user/users-list', () => ({ UsersList: () => <div data-testid="users-list" /> }));
jest.mock('@/components/dashboard/plan/plan-limit-create-button', () => ({ PlanLimitCreateButton: () => <div /> }));
jest.mock('@/components/dashboard/plan/plan-usage-banner', () => ({ PlanUsageBanner: () => <div /> }));

const { getCurrentUser } = require('@/lib/auth/get-current-user');
const { isAdmin, isOwner } = require('@/lib/auth/roles');
const { getAllUsers } = require('@/actions/dashboard/user/actions');

describe('UsersListPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getCurrentUser.mockResolvedValue({ id: '1', role: { name: 'admin' }, organization_id: '1' });
    isAdmin.mockReturnValue(true);
    isOwner.mockReturnValue(false);
    getAllUsers.mockResolvedValue([]);
  });

  it('exports a default async function', () => {
    expect(typeof UsersListPage).toBe('function');
  });

  it('renders without crashing for admin', async () => {
    const result = await UsersListPage();
    expect(result).toBeTruthy();
  });

  it('redirects when no current user', async () => {
    getCurrentUser.mockResolvedValue(null);
    await UsersListPage();
    expect(redirect).toHaveBeenCalledWith('/auth/login');
  });

  it('renders for admin showing all users', async () => {
    const result = await UsersListPage();
    expect(result).toBeTruthy();
    expect(getAllUsers).toHaveBeenCalledWith();
  });

  it('renders for owner showing org users from cookie', async () => {
    getCurrentUser.mockResolvedValue({ id: '1', role: { name: 'owner' }, organization_id: '1' });
    isAdmin.mockReturnValue(false);
    isOwner.mockReturnValue(true);

    const result = await UsersListPage();
    expect(result).toBeTruthy();
    expect(getAllUsers).toHaveBeenCalledWith('org-1');
  });

  it('renders for owner using organization_id when no cookie', async () => {
    const { cookies } = require('next/headers');
    (cookies as jest.Mock).mockResolvedValue({ get: jest.fn(() => undefined) });

    getCurrentUser.mockResolvedValue({ id: '1', role: { name: 'owner' }, organization_id: 'fallback-org' });
    isAdmin.mockReturnValue(false);
    isOwner.mockReturnValue(true);

    const result = await UsersListPage();
    expect(result).toBeTruthy();
    expect(getAllUsers).toHaveBeenCalledWith('fallback-org');
  });

  it('redirects when user has non-admin and non-owner role', async () => {
    getCurrentUser.mockResolvedValue({ id: '1', role: { name: 'cashier' }, organization_id: '1' });
    isAdmin.mockReturnValue(false);
    isOwner.mockReturnValue(false);

    await UsersListPage();
    expect(redirect).toHaveBeenCalledWith('/dashboard');
  });
});
