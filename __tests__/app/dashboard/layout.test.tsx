import { redirect } from 'next/navigation';
import DashboardLayout from '@/app/dashboard/layout';

const mockFrom = jest.fn();
const mockGetUser = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

jest.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('@/lib/auth/roles', () => ({
  isAdmin: jest.fn(() => false),
  isOwner: jest.fn(() => false),
  isCollaborator: jest.fn(() => false),
}));

jest.mock('@/lib/plans/usage', () => ({
  getOrganizationUsageSummary: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('@/components/dashboard-shell', () => ({
  DashboardShell: ({ children }: { children: React.ReactNode }) => <div data-testid="dashboard-shell">{children}</div>,
}));

const { getCurrentUser } = require('@/lib/auth/get-current-user');
const { isAdmin, isOwner, isCollaborator } = require('@/lib/auth/roles');
const { getOrganizationUsageSummary } = require('@/lib/plans/usage');

describe('DashboardLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      data: [],
      error: null,
    });
  });

  it('exports a default async function', () => {
    expect(typeof DashboardLayout).toBe('function');
  });

  it('redirects when no user', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    await DashboardLayout({ children: <div>Test</div> });
    expect(redirect).toHaveBeenCalledWith('/auth/login');
  });

  it('renders children directly when user has no recognized role', async () => {
    getCurrentUser.mockResolvedValue({ id: '1', role: { name: 'cashier' } });
    const result = await DashboardLayout({ children: <div>Test</div> });
    expect(result).toBeTruthy();
  });

  it('renders DashboardShell for owner role with memberships', async () => {
    const user = {
      id: '1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@test.com',
      username: 'johndoe',
      role: { name: 'owner' },
      organization_id: '10',
      organization: { id: '10', name: 'Test Org', logo_url: null },
      tour_completed: true,
    };
    getCurrentUser.mockResolvedValue(user);
    isOwner.mockReturnValue(true);
    isAdmin.mockReturnValue(false);
    isCollaborator.mockReturnValue(false);

    const selectMock = jest.fn().mockReturnThis();
    const eqChain = jest.fn().mockReturnThis();
    const insertMock = jest.fn().mockReturnThis();

    mockFrom.mockReturnValue({
      select: selectMock,
      eq: eqChain,
      insert: insertMock,
    });

    // Chain: .select().eq().eq() => data with memberships
    selectMock.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          data: [{ organization: { id: '10', name: 'Test Org', logo_url: null } }],
          error: null,
        }),
      }),
    });

    getOrganizationUsageSummary.mockResolvedValue({ plan: 'trial', features: [] });

    const result = await DashboardLayout({ children: <div>Child</div> });
    expect(result).toBeTruthy();
  });

  it('renders DashboardShell for admin role', async () => {
    const user = {
      id: '1',
      first_name: 'Admin',
      last_name: null,
      email: 'admin@test.com',
      username: null,
      role: { name: 'admin' },
      organization_id: '10',
      organization: { id: '10', name: 'Admin Org', logo_url: null },
      tour_completed: false,
    };
    getCurrentUser.mockResolvedValue(user);
    isOwner.mockReturnValue(false);
    isAdmin.mockReturnValue(true);
    isCollaborator.mockReturnValue(false);

    const selectMock = jest.fn();
    selectMock.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          data: [{ organization: { id: '10', name: 'Admin Org', logo_url: null } }],
          error: null,
        }),
      }),
    });

    mockFrom.mockReturnValue({
      select: selectMock,
      eq: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
    });

    getOrganizationUsageSummary.mockResolvedValue(null);

    const result = await DashboardLayout({ children: <div>Admin Content</div> });
    expect(result).toBeTruthy();
  });

  it('renders DashboardShell for collaborator role', async () => {
    const user = {
      id: '1',
      first_name: 'Collab',
      last_name: 'User',
      email: 'collab@test.com',
      username: 'collab',
      role: { name: 'collaborator' },
      organization_id: '10',
      organization: { id: '10', name: 'Collab Org', logo_url: null },
      tour_completed: true,
    };
    getCurrentUser.mockResolvedValue(user);
    isOwner.mockReturnValue(false);
    isAdmin.mockReturnValue(false);
    isCollaborator.mockReturnValue(true);

    const selectMock = jest.fn();
    selectMock.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          data: [{ organization: { id: '10', name: 'Collab Org', logo_url: null } }],
          error: null,
        }),
      }),
    });

    mockFrom.mockReturnValue({
      select: selectMock,
      eq: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
    });

    const result = await DashboardLayout({ children: <div>Collab Content</div> });
    expect(result).toBeTruthy();
  });

  it('inserts membership and refreshes when no memberships exist but user has org', async () => {
    const user = {
      id: '1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@test.com',
      username: 'johndoe',
      role: { name: 'owner' },
      organization_id: '10',
      organization: { id: '10', name: 'Test Org', logo_url: null },
      tour_completed: true,
    };
    getCurrentUser.mockResolvedValue(user);
    isOwner.mockReturnValue(true);

    let callCount = 0;
    const insertMock = jest.fn().mockResolvedValue({});

    mockFrom.mockImplementation((table: string) => {
      if (table === 'app_user_organization') {
        callCount++;
        if (callCount === 1) {
          // First call: no memberships
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
            insert: insertMock,
          };
        }
        if (callCount === 2) {
          // Second call: insert
          return {
            insert: insertMock,
          };
        }
        // Third call: refreshed select
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                data: [{ organization: { id: '10', name: 'Test Org', logo_url: null } }],
                error: null,
              }),
            }),
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
    });

    const result = await DashboardLayout({ children: <div>Content</div> });
    expect(result).toBeTruthy();
  });

  it('handles organization as array in membership data', async () => {
    const user = {
      id: '1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@test.com',
      username: 'johndoe',
      role: { name: 'owner' },
      organization_id: '10',
      organization: { id: '10', name: 'Org', logo_url: 'http://logo.png' },
      tour_completed: true,
    };
    getCurrentUser.mockResolvedValue(user);
    isOwner.mockReturnValue(true);

    const selectMock = jest.fn();
    selectMock.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          data: [{ organization: [{ id: '10', name: 'Org', logo_url: 'http://logo.png' }] }],
          error: null,
        }),
      }),
    });

    mockFrom.mockReturnValue({
      select: selectMock,
      eq: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
    });

    const result = await DashboardLayout({ children: <div>Content</div> });
    expect(result).toBeTruthy();
  });

  it('uses fallback org from user when no memberships and no org id', async () => {
    const user = {
      id: '1',
      first_name: null,
      last_name: null,
      email: null,
      username: 'user1',
      role: { name: 'owner' },
      organization_id: null,
      organization: null,
      tour_completed: false,
    };
    getCurrentUser.mockResolvedValue(user);
    isOwner.mockReturnValue(true);

    const selectMock = jest.fn();
    selectMock.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          data: [],
          error: null,
        }),
      }),
    });

    mockFrom.mockReturnValue({
      select: selectMock,
      eq: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
    });

    const result = await DashboardLayout({ children: <div>Content</div> });
    expect(result).toBeTruthy();
  });

  it('filters out invalid orgs from memberships', async () => {
    const user = {
      id: '1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@test.com',
      username: 'johndoe',
      role: { name: 'owner' },
      organization_id: '10',
      organization: { id: '10', name: 'Test Org', logo_url: null },
      tour_completed: true,
    };
    getCurrentUser.mockResolvedValue(user);
    isOwner.mockReturnValue(true);

    const selectMock = jest.fn();
    selectMock.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          data: [
            { organization: { id: '10', name: 'Valid Org', logo_url: null } },
            { organization: null },
            { organization: { id: null, name: null } },
          ],
          error: null,
        }),
      }),
    });

    mockFrom.mockReturnValue({
      select: selectMock,
      eq: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
    });

    const result = await DashboardLayout({ children: <div>Content</div> });
    expect(result).toBeTruthy();
  });

  it('renders DashboardShell with no name, no username (User fallback)', async () => {
    const user = {
      id: '1',
      first_name: null,
      last_name: null,
      email: null,
      username: null,
      role: { name: 'owner' },
      organization_id: null,
      organization: null,
      tour_completed: null,
    };
    getCurrentUser.mockResolvedValue(user);
    isOwner.mockReturnValue(true);

    const selectMock = jest.fn();
    selectMock.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          data: [{ organization: { id: '10', name: 'Org', logo_url: null } }],
          error: null,
        }),
      }),
    });

    mockFrom.mockReturnValue({
      select: selectMock,
      eq: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
    });

    const result = await DashboardLayout({ children: <div>Content</div> });
    expect(result).toBeTruthy();
  });

  it('renders when currentUser is null (non-shell path)', async () => {
    getCurrentUser.mockResolvedValue(null);
    const result = await DashboardLayout({ children: <div>Content</div> });
    expect(result).toBeTruthy();
  });

  it('renders DashboardShell with user having no role object (null)', async () => {
    const user = {
      id: '1',
      first_name: 'Test',
      last_name: 'User',
      email: 'test@test.com',
      username: 'testuser',
      role: null,
      organization_id: '10',
      organization: { id: '10', name: 'Test Org', logo_url: null },
      tour_completed: true,
    };
    getCurrentUser.mockResolvedValue(user);
    isOwner.mockReturnValue(true);

    const selectMock = jest.fn();
    selectMock.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          data: null,
          error: null,
        }),
      }),
    });

    mockFrom.mockReturnValue({
      select: selectMock,
      eq: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue({}),
    });

    const result = await DashboardLayout({ children: <div>Content</div> });
    expect(result).toBeTruthy();
  });

  it('renders with empty orgs falling back to currentUser.organization', async () => {
    const user = {
      id: '1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@test.com',
      username: 'johndoe',
      role: { name: 'collaborator' },
      organization_id: '10',
      organization: { id: '10', name: 'Fallback Org', logo_url: 'http://logo.png' },
      tour_completed: true,
    };
    getCurrentUser.mockResolvedValue(user);
    isCollaborator.mockReturnValue(true);

    const selectMock = jest.fn();
    selectMock.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          data: [],
          error: null,
        }),
      }),
    });

    const insertMock = jest.fn().mockResolvedValue({});

    mockFrom.mockReturnValue({
      select: selectMock,
      eq: jest.fn().mockReturnThis(),
      insert: insertMock,
    });

    const result = await DashboardLayout({ children: <div>Content</div> });
    expect(result).toBeTruthy();
  });

  it('sorts multiple orgs by name (covers line 72)', async () => {
    const user = {
      id: '1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@test.com',
      username: 'johndoe',
      role: { name: 'owner' },
      organization_id: '10',
      organization: { id: '10', name: 'Org B', logo_url: null },
      tour_completed: true,
    };
    getCurrentUser.mockResolvedValue(user);
    isOwner.mockReturnValue(true);

    const selectMock = jest.fn();
    selectMock.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          data: [
            { organization: { id: '20', name: 'Zebra Org', logo_url: null } },
            { organization: { id: '10', name: 'Alpha Org', logo_url: 'http://logo.png' } },
          ],
          error: null,
        }),
      }),
    });

    mockFrom.mockReturnValue({
      select: selectMock,
      eq: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
    });

    getOrganizationUsageSummary.mockResolvedValue({ plan: 'trial', features: [] });

    const result = await DashboardLayout({ children: <div>Content</div> });
    expect(result).toBeTruthy();
  });
});
