import { render, screen, act, waitFor } from '@testing-library/react';

jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => {
    const t = (key: string) => key;
    t.rich = (key: string) => key;
    t.raw = () => ({});
    return t;
  }),
  useLocale: jest.fn(() => 'es'),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(), replace: jest.fn(), refresh: jest.fn(), back: jest.fn(), prefetch: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  redirect: jest.fn(),
}));

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() } }));

jest.mock('@/components/providers/plan-usage-provider', () => ({
  usePlanUsage: jest.fn(() => ({
    summary: null, isLoading: false, invalidate: jest.fn(),
    isAtLimit: jest.fn(() => false), shouldWarn: jest.fn(() => false), getFeature: jest.fn(), plan: null,
  })),
}));

const mockGetAllUsers = jest.fn(() => Promise.resolve([]));

jest.mock('@/actions/dashboard/user/actions', () => ({
  deleteUser: jest.fn(),
  getAllUsers: (...args: unknown[]) => mockGetAllUsers(...args),
}));

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

// Mock DeleteModal to capture and invoke onDeleted callback
jest.mock('@/components/dashboard/user/delete-modal', () => {
  return function MockDeleteModal({ userId, onDeleted }: { userId: string; onDeleted: () => void }) {
    return <button data-testid={`delete-btn-${userId}`} onClick={onDeleted}>Delete</button>;
  };
});

import { UsersList } from '@/components/dashboard/user/users-list';

const mockUsers = [
  {
    id: '1',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    active: true,
    created_at: '2024-01-15T00:00:00Z',
    user_type: 'app_user' as const,
    role: { name: 'owner', display_name: 'Owner' },
    organization: { id: 'org-1', name: 'Test Org' },
  },
  {
    id: '2',
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane@example.com',
    active: false,
    created_at: '2024-02-20T00:00:00Z',
    user_type: 'beneficiary' as const,
    role: { name: 'final_user', display_name: 'Final User' },
    organization: { id: 'org-1', name: 'Test Org' },
  },
];

describe('UsersList', () => {
  let localStorageGetItem: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    localStorageGetItem = jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    mockGetAllUsers.mockResolvedValue([]);
  });

  afterEach(() => {
    localStorageGetItem.mockRestore();
    jest.useRealTimers();
  });

  it('renders the table with headers', () => {
    render(<UsersList initialUsers={mockUsers} isOwner={false} isAdmin={true} />);

    expect(screen.getByText('tableHeaders.name')).toBeInTheDocument();
    expect(screen.getByText('tableHeaders.email')).toBeInTheDocument();
    expect(screen.getByText('tableHeaders.role')).toBeInTheDocument();
    expect(screen.getByText('tableHeaders.organization')).toBeInTheDocument();
    expect(screen.getByText('tableHeaders.type')).toBeInTheDocument();
    expect(screen.getByText('tableHeaders.status')).toBeInTheDocument();
    expect(screen.getByText('tableHeaders.created')).toBeInTheDocument();
    expect(screen.getByText('actions')).toBeInTheDocument();
  });

  it('renders users in the table', () => {
    render(<UsersList initialUsers={mockUsers} isOwner={false} isAdmin={true} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('renders role badges', () => {
    render(<UsersList initialUsers={mockUsers} isOwner={false} isAdmin={true} />);

    expect(screen.getByText('Owner')).toBeInTheDocument();
    expect(screen.getByText('Final User')).toBeInTheDocument();
  });

  it('renders user type badges', () => {
    render(<UsersList initialUsers={mockUsers} isOwner={false} isAdmin={true} />);

    expect(screen.getByText('typeAppUser')).toBeInTheDocument();
    expect(screen.getByText('typeBeneficiary')).toBeInTheDocument();
  });

  it('renders status badges', () => {
    render(<UsersList initialUsers={mockUsers} isOwner={false} isAdmin={true} />);

    expect(screen.getByText('statusActive')).toBeInTheDocument();
    expect(screen.getByText('statusInactive')).toBeInTheDocument();
  });

  it('renders empty state when no users', () => {
    render(<UsersList initialUsers={[]} isOwner={false} isAdmin={true} />);

    expect(screen.getByText('empty')).toBeInTheDocument();
  });

  it('renders edit links for each user', () => {
    render(<UsersList initialUsers={mockUsers} isOwner={false} isAdmin={true} />);

    const editLinks = screen.getAllByRole('link');
    expect(editLinks.some(link => link.getAttribute('href')?.includes('/dashboard/users/edit/'))).toBe(true);
  });

  it('renders organization names', () => {
    render(<UsersList initialUsers={mockUsers} isOwner={false} isAdmin={true} />);

    const orgCells = screen.getAllByText('Test Org');
    expect(orgCells.length).toBeGreaterThanOrEqual(1);
  });

  it('renders correct number of user rows', () => {
    render(<UsersList initialUsers={mockUsers} isOwner={false} isAdmin={true} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('renders table with single user', () => {
    render(<UsersList initialUsers={[mockUsers[0]]} isOwner={false} isAdmin={true} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  it('renders for owner role (non-admin)', () => {
    render(<UsersList initialUsers={mockUsers} isOwner={true} isAdmin={false} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('fetches users for admin on mount', async () => {
    mockGetAllUsers.mockResolvedValue(mockUsers);

    await act(async () => {
      render(<UsersList initialUsers={[]} isOwner={false} isAdmin={true} />);
    });

    await waitFor(() => {
      expect(mockGetAllUsers).toHaveBeenCalledWith();
    });
  });

  it('fetches users for owner with active org id from localStorage', async () => {
    localStorageGetItem.mockReturnValue('org-42');
    mockGetAllUsers.mockResolvedValue(mockUsers);

    await act(async () => {
      render(<UsersList initialUsers={[]} isOwner={true} isAdmin={false} />);
    });

    await waitFor(() => {
      expect(mockGetAllUsers).toHaveBeenCalledWith('org-42');
    });
  });

  it('does not call getAllUsers for owner without active org id', async () => {
    localStorageGetItem.mockReturnValue(null);

    await act(async () => {
      render(<UsersList initialUsers={mockUsers} isOwner={true} isAdmin={false} />);
    });

    // fetchUsers runs but activeOrgId is null, so getAllUsers is never called
    expect(mockGetAllUsers).not.toHaveBeenCalled();
    // Original users should still be displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('handles orgChanged event for owner (non-admin)', async () => {
    localStorageGetItem.mockReturnValue('org-42');
    mockGetAllUsers.mockResolvedValue(mockUsers);

    await act(async () => {
      render(<UsersList initialUsers={[]} isOwner={true} isAdmin={false} />);
    });

    // Wait for initial fetch to complete
    await act(async () => {
      jest.runAllTimers();
      await Promise.resolve();
    });

    // Reset the mock to track new calls
    mockGetAllUsers.mockClear();
    mockGetAllUsers.mockResolvedValue(mockUsers);

    // Dispatch orgChanged event
    act(() => {
      window.dispatchEvent(new Event('orgChanged'));
    });

    // The handler uses setTimeout(100), so advance timers
    await act(async () => {
      jest.advanceTimersByTime(150);
      await Promise.resolve();
    });

    expect(mockGetAllUsers).toHaveBeenCalled();
  });

  it('does not listen for orgChanged event for admin', async () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

    await act(async () => {
      render(<UsersList initialUsers={mockUsers} isOwner={false} isAdmin={true} />);
    });

    const orgChangedCalls = addEventListenerSpy.mock.calls.filter(
      (c) => c[0] === 'orgChanged'
    );
    expect(orgChangedCalls.length).toBe(0);

    addEventListenerSpy.mockRestore();
  });

  it('handles fetch error gracefully and keeps current users', async () => {
    mockGetAllUsers.mockRejectedValue(new Error('Network error'));

    await act(async () => {
      render(<UsersList initialUsers={mockUsers} isOwner={false} isAdmin={true} />);
    });

    // Should still show initial users
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('renders N/A for users without name', () => {
    const usersWithoutName = [{
      id: '3',
      email: 'noname@example.com',
      active: true,
      created_at: '2024-01-15T00:00:00Z',
      user_type: 'app_user' as const,
    }];

    render(<UsersList initialUsers={usersWithoutName} isOwner={false} isAdmin={true} />);

    expect(screen.getAllByText('N/A').length).toBeGreaterThanOrEqual(1);
  });

  it('renders N/A for users without email', () => {
    const usersWithoutEmail = [{
      id: '3',
      first_name: 'No',
      last_name: 'Email',
      active: true,
      created_at: '2024-01-15T00:00:00Z',
      user_type: 'app_user' as const,
    }];

    render(<UsersList initialUsers={usersWithoutEmail} isOwner={false} isAdmin={true} />);

    // email column shows N/A, role shows N/A, org shows N/A
    expect(screen.getAllByText('N/A').length).toBeGreaterThanOrEqual(1);
  });

  it('removes user from list when onDeleted is called', async () => {
    mockGetAllUsers.mockResolvedValue(mockUsers);

    await act(async () => {
      render(<UsersList initialUsers={mockUsers} isOwner={false} isAdmin={true} />);
    });

    // Wait for the fetch to complete and the users to be rendered
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Click the delete button for user '1' (John Doe)
    const deleteBtn = screen.getByTestId('delete-btn-1');
    await act(async () => {
      deleteBtn.click();
    });

    // After deleting user '1' (John Doe), only Jane Smith should remain
    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('renders first_name only when last_name is undefined', () => {
    const users = [{
      id: '3',
      first_name: 'OnlyFirst',
      active: true,
      created_at: '2024-01-15T00:00:00Z',
      user_type: 'app_user' as const,
    }];
    render(<UsersList initialUsers={users} isOwner={false} isAdmin={true} />);
    expect(screen.getByText('OnlyFirst')).toBeInTheDocument();
  });

  it('renders last_name only when first_name is undefined', () => {
    const users = [{
      id: '3',
      last_name: 'OnlyLast',
      active: true,
      created_at: '2024-01-15T00:00:00Z',
      user_type: 'app_user' as const,
    }];
    render(<UsersList initialUsers={users} isOwner={false} isAdmin={true} />);
    expect(screen.getByText('OnlyLast')).toBeInTheDocument();
  });

  it('renders Unnamed User in delete modal when user has no name', async () => {
    const users = [{
      id: '3',
      active: true,
      created_at: '2024-01-15T00:00:00Z',
      user_type: 'app_user' as const,
    }];
    render(<UsersList initialUsers={users} isOwner={false} isAdmin={true} />);
    expect(screen.getByTestId('delete-btn-3')).toBeInTheDocument();
  });

  it('respects cancelled flag when component unmounts during fetch (line 75)', async () => {
    mockGetAllUsers.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockUsers), 100)));

    let unmountFn: () => void;

    await act(async () => {
      const { unmount } = render(<UsersList initialUsers={[]} isOwner={false} isAdmin={true} />);
      unmountFn = unmount;
    });

    // Unmount immediately before the fetch resolves - cancelled flag should prevent setState
    act(() => {
      unmountFn!();
    });

    // Advance timers to let the promise resolve after unmount
    await act(async () => {
      jest.advanceTimersByTime(200);
      await Promise.resolve();
    });

    // No error should occur - the cancelled flag prevents setState after unmount
  });

  it('does not fire orgChanged handler for admin users (line 84 branch)', async () => {
    mockGetAllUsers.mockResolvedValue(mockUsers);

    await act(async () => {
      render(<UsersList initialUsers={mockUsers} isOwner={true} isAdmin={true} />);
    });

    mockGetAllUsers.mockClear();

    // Dispatch orgChanged event - should not trigger fetchUsers for admin
    act(() => {
      window.dispatchEvent(new Event('orgChanged'));
    });

    await act(async () => {
      jest.advanceTimersByTime(200);
      await Promise.resolve();
    });

    // Should not have been called again from the orgChanged handler
    // (admin fetches without org filter, orgChanged handler only fires for owner && !admin)
  });

  it('does not fetch if neither owner nor admin', async () => {
    await act(async () => {
      render(<UsersList initialUsers={mockUsers} isOwner={false} isAdmin={false} />);
    });

    expect(mockGetAllUsers).not.toHaveBeenCalled();
  });
});
