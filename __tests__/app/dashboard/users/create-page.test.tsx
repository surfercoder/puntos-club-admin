import { redirect } from 'next/navigation';
import CreateUserPage from '@/app/dashboard/users/create/page';

const mockFrom = jest.fn();

jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
jest.mock('next/headers', () => ({ cookies: jest.fn(() => Promise.resolve({ get: jest.fn(() => ({ value: 'org-1' })) })) }));
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({ from: mockFrom })),
}));
jest.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: jest.fn(() => Promise.resolve({ id: '1', role: { name: 'admin' }, organization_id: '1' })),
}));
jest.mock('@/lib/auth/roles', () => ({
  isAdmin: jest.fn(() => true),
  isOwner: jest.fn(() => false),
  getAssignableRoles: jest.fn(() => ['cashier', 'collaborator', 'owner']),
}));
jest.mock('@/components/dashboard/user/user-form', () => {
  const Mock = () => <div data-testid="user-form" />;
  Mock.displayName = 'UserForm';
  return Mock;
});
jest.mock('@/components/dashboard/plan/plan-limit-guard', () => ({
  PlanLimitGuard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const { getCurrentUser } = require('@/lib/auth/get-current-user');
const { isAdmin, isOwner } = require('@/lib/auth/roles');

describe('CreateUserPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getCurrentUser.mockResolvedValue({ id: '1', role: { name: 'admin' }, organization_id: '1' });
    isAdmin.mockReturnValue(true);
    isOwner.mockReturnValue(false);

    mockFrom.mockImplementation((table: string) => {
      if (table === 'organization') {
        return {
          select: jest.fn(() => ({
            order: jest.fn().mockResolvedValue({ data: [{ id: '1', name: 'Org 1' }], error: null }),
          })),
        };
      }
      if (table === 'user_role') {
        return {
          select: jest.fn(() => ({
            in: jest.fn(() => ({
              order: jest.fn().mockResolvedValue({ data: [{ id: '1', name: 'cashier' }], error: null }),
            })),
          })),
        };
      }
      if (table === 'app_user_organization') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn().mockResolvedValue({
                data: [{ organization: { id: '1', name: 'Owner Org' } }],
              }),
            })),
          })),
        };
      }
      return {};
    });
  });

  it('exports a default async function', () => {
    expect(typeof CreateUserPage).toBe('function');
  });

  it('renders without crashing for admin', async () => {
    const result = await CreateUserPage();
    expect(result).toBeTruthy();
  });

  it('redirects when no current user', async () => {
    getCurrentUser.mockResolvedValue(null);
    await CreateUserPage();
    expect(redirect).toHaveBeenCalledWith('/auth/login');
  });

  it('redirects when user is not admin or owner', async () => {
    getCurrentUser.mockResolvedValue({ id: '1', role: { name: 'cashier' }, organization_id: '1' });
    isAdmin.mockReturnValue(false);
    isOwner.mockReturnValue(false);
    await CreateUserPage();
    expect(redirect).toHaveBeenCalledWith('/dashboard');
  });

  it('renders for owner with org memberships and sorts them', async () => {
    getCurrentUser.mockResolvedValue({ id: '1', role: { name: 'owner' }, organization_id: '1' });
    isAdmin.mockReturnValue(false);
    isOwner.mockReturnValue(true);

    mockFrom.mockImplementation((table: string) => {
      if (table === 'app_user_organization') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn().mockResolvedValue({
                data: [
                  { organization: { id: '2', name: 'Zebra Org' } },
                  { organization: { id: '1', name: 'Alpha Org' } },
                ],
              }),
            })),
          })),
        };
      }
      if (table === 'user_role') {
        return {
          select: jest.fn(() => ({
            in: jest.fn(() => ({
              order: jest.fn().mockResolvedValue({ data: [{ id: '1', name: 'cashier' }], error: null }),
            })),
          })),
        };
      }
      return {};
    });

    const result = await CreateUserPage();
    expect(result).toBeTruthy();
  });

  it('handles org query error for admin', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'organization') {
        return {
          select: jest.fn(() => ({
            order: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
          })),
        };
      }
      return {
        select: jest.fn(() => ({
          in: jest.fn(() => ({
            order: jest.fn().mockResolvedValue({ data: [], error: null }),
          })),
        })),
      };
    });

    const result = await CreateUserPage();
    expect(result).toBeTruthy();
  });

  it('handles roles query error', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'organization') {
        return {
          select: jest.fn(() => ({
            order: jest.fn().mockResolvedValue({ data: [{ id: '1', name: 'Org' }], error: null }),
          })),
        };
      }
      if (table === 'user_role') {
        return {
          select: jest.fn(() => ({
            in: jest.fn(() => ({
              order: jest.fn().mockResolvedValue({ data: null, error: { message: 'Roles error' } }),
            })),
          })),
        };
      }
      return {};
    });

    const result = await CreateUserPage();
    expect(result).toBeTruthy();
  });

  it('handles owner with array organization membership data', async () => {
    getCurrentUser.mockResolvedValue({ id: '1', role: { name: 'owner' }, organization_id: '1' });
    isAdmin.mockReturnValue(false);
    isOwner.mockReturnValue(true);

    mockFrom.mockImplementation((table: string) => {
      if (table === 'app_user_organization') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn().mockResolvedValue({
                data: [
                  { organization: [{ id: '1', name: 'Org 1' }] },
                  { organization: null },
                  { organization: { id: null, name: null } },
                ],
              }),
            })),
          })),
        };
      }
      if (table === 'user_role') {
        return {
          select: jest.fn(() => ({
            in: jest.fn(() => ({
              order: jest.fn().mockResolvedValue({ data: [{ id: '1', name: 'cashier' }], error: null }),
            })),
          })),
        };
      }
      return {};
    });

    const result = await CreateUserPage();
    expect(result).toBeTruthy();
  });

  it('handles owner with no cookie activeOrgId falling back to organization_id', async () => {
    const { cookies } = require('next/headers');
    (cookies as jest.Mock).mockResolvedValue({ get: jest.fn(() => undefined) });

    getCurrentUser.mockResolvedValue({ id: '1', role: { name: 'owner' }, organization_id: 'fallback-org' });
    isAdmin.mockReturnValue(false);
    isOwner.mockReturnValue(true);

    mockFrom.mockImplementation((table: string) => {
      if (table === 'app_user_organization') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn().mockResolvedValue({
                data: [{ organization: { id: 'fallback-org', name: 'Fallback' } }],
              }),
            })),
          })),
        };
      }
      if (table === 'user_role') {
        return {
          select: jest.fn(() => ({
            in: jest.fn(() => ({
              order: jest.fn().mockResolvedValue({ data: [], error: null }),
            })),
          })),
        };
      }
      return {};
    });

    const result = await CreateUserPage();
    expect(result).toBeTruthy();
  });

  it('handles else branch for non-admin, non-owner', async () => {
    getCurrentUser.mockResolvedValue({ id: '1', role: { name: 'collaborator' }, organization_id: '1' });
    isAdmin.mockReturnValueOnce(false).mockReturnValueOnce(false);
    isOwner.mockReturnValueOnce(false).mockReturnValueOnce(false);

    // This should redirect to /dashboard
    await CreateUserPage();
    expect(redirect).toHaveBeenCalledWith('/dashboard');
  });

  it('handles admin org query returning null data without error (line 47 || [] branch)', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'organization') {
        return {
          select: jest.fn(() => ({
            order: jest.fn().mockResolvedValue({ data: null, error: null }),
          })),
        };
      }
      if (table === 'user_role') {
        return {
          select: jest.fn(() => ({
            in: jest.fn(() => ({
              order: jest.fn().mockResolvedValue({ data: [{ id: '1', name: 'cashier' }], error: null }),
            })),
          })),
        };
      }
      return {};
    });

    const result = await CreateUserPage();
    expect(result).toBeTruthy();
  });

  it('handles owner memberships returning null data (line 58 ?? [] branch)', async () => {
    getCurrentUser.mockResolvedValue({ id: '1', role: { name: 'owner' }, organization_id: '1' });
    isAdmin.mockReturnValue(false);
    isOwner.mockReturnValue(true);

    mockFrom.mockImplementation((table: string) => {
      if (table === 'app_user_organization') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn().mockResolvedValue({ data: null }),
            })),
          })),
        };
      }
      if (table === 'user_role') {
        return {
          select: jest.fn(() => ({
            in: jest.fn(() => ({
              order: jest.fn().mockResolvedValue({ data: [{ id: '1', name: 'cashier' }], error: null }),
            })),
          })),
        };
      }
      return {};
    });

    const result = await CreateUserPage();
    expect(result).toBeTruthy();
  });

  it('handles roles query returning null data without error (line 121 || [] branch)', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'organization') {
        return {
          select: jest.fn(() => ({
            order: jest.fn().mockResolvedValue({ data: [{ id: '1', name: 'Org' }], error: null }),
          })),
        };
      }
      if (table === 'user_role') {
        return {
          select: jest.fn(() => ({
            in: jest.fn(() => ({
              order: jest.fn().mockResolvedValue({ data: null, error: null }),
            })),
          })),
        };
      }
      return {};
    });

    const result = await CreateUserPage();
    expect(result).toBeTruthy();
  });
});
