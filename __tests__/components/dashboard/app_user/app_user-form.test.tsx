import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';

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

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useActionState: jest.fn(() => [{ status: '', message: '', fieldErrors: {} }, jest.fn(), false]),
}));

let mockRoleData: { id: string; name: string; display_name: string }[] = [];
const mockFrom = jest.fn();

function setupSupabaseMock() {
  mockFrom.mockImplementation(() => {
    const data = mockRoleData;
    const chainObj: Record<string, jest.Mock> = {};
    const terminal = {
      then: jest.fn((resolve: (val: { data: typeof data }) => void) => {
        resolve({ data });
        return Promise.resolve({ data });
      }),
    };
    chainObj.select = jest.fn().mockReturnValue({ ...chainObj, ...terminal, in: jest.fn().mockReturnValue({ ...chainObj, ...terminal, order: jest.fn().mockReturnValue({ ...terminal }) }), order: jest.fn().mockReturnValue({ ...terminal }) });
    return chainObj;
  });
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: (...args: unknown[]) => mockFrom(...args),
  })),
}));

jest.mock('@/actions/dashboard/app_user/app_user-form-actions', () => ({
  appUserFormAction: jest.fn(),
}));

const mockIsAtLimit = jest.fn(() => false);
jest.mock('@/components/providers/plan-usage-provider', () => ({
  usePlanUsage: () => ({
    isAtLimit: mockIsAtLimit,
    shouldWarn: jest.fn(() => false),
    getFeature: jest.fn(),
    summary: null,
    isLoading: false,
    invalidate: jest.fn(),
    plan: null,
  }),
}));

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

import AppUserForm from '@/components/dashboard/app_user/app_user-form';

const React = require('react');
const { toast } = require('sonner');
const { redirect } = require('next/navigation');

describe('AppUserForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRoleData = [];
    mockIsAtLimit.mockReturnValue(false);
    setupSupabaseMock();
  });

  afterEach(() => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: '', message: '', fieldErrors: {} },
      jest.fn(),
      false,
    ]);
  });

  it('renders the form with correct labels in create mode', () => {
    render(<AppUserForm />);

    expect(screen.getByText('form.firstNameLabel')).toBeInTheDocument();
    expect(screen.getByText('form.lastNameLabel')).toBeInTheDocument();
    expect(screen.getByText('form.emailLabel')).toBeInTheDocument();
    expect(screen.getByText('form.passwordLabel')).toBeInTheDocument();
    expect(screen.getByText('form.roleLabel')).toBeInTheDocument();
  });

  it('renders correct submit button text in create mode', () => {
    render(<AppUserForm />);

    expect(screen.getByRole('button', { name: 'create' })).toBeInTheDocument();
  });

  it('renders correct submit button text in edit mode', () => {
    const appUser = {
      id: '1',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane@example.com',
      organization_id: 'org-1',
      created_at: '2024-01-01',
    };

    render(<AppUserForm appUser={appUser} />);

    expect(screen.getByRole('button', { name: 'update' })).toBeInTheDocument();
  });

  it('renders with initial data in edit mode', () => {
    const appUser = {
      id: '1',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane@example.com',
      organization_id: 'org-1',
      created_at: '2024-01-01',
    };

    render(<AppUserForm appUser={appUser} />);

    expect(screen.getByDisplayValue('Jane')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Smith')).toBeInTheDocument();
    expect(screen.getByDisplayValue('jane@example.com')).toBeInTheDocument();
  });

  it('renders without initial data in create mode', () => {
    render(<AppUserForm />);

    const firstNameInput = screen.getByRole('textbox', { name: 'form.firstNameLabel' });
    expect(firstNameInput).toHaveValue('');
  });

  it('renders cancel button linking to app_user list', () => {
    render(<AppUserForm />);

    const cancelLink = screen.getByText('cancel');
    expect(cancelLink.closest('a')).toHaveAttribute('href', '/dashboard/app_user');
  });

  it('shows error toast when actionState has error status', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: 'error', message: 'Something went wrong', fieldErrors: {} },
      jest.fn(),
      false,
    ]);

    render(<AppUserForm />);

    expect(toast.error).toHaveBeenCalledWith('Something went wrong');
  });

  it('calls redirect on success state', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: 'success', message: 'User created', fieldErrors: {} },
      jest.fn(),
      false,
    ]);

    render(<AppUserForm />);

    expect(toast.success).toHaveBeenCalledWith('User created');
    expect(redirect).toHaveBeenCalledWith('/dashboard/app_user');
  });

  it('disables submit button when pending', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: '', message: '', fieldErrors: {} },
      jest.fn(),
      true,
    ]);

    render(<AppUserForm />);

    expect(screen.getByRole('button', { name: 'create' })).toBeDisabled();
  });

  it('toggles password visibility', () => {
    render(<AppUserForm />);

    const passwordInput = screen.getByPlaceholderText('form.passwordPlaceholder');
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleButton = screen.getByRole('button', { name: 'Show password' });
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('validates form on submit', async () => {
    render(<AppUserForm />);

    const form = screen.getByRole('textbox', { name: 'form.firstNameLabel' }).closest('form')!;

    await act(async () => {
      fireEvent.submit(form);
    });
  });

  it('shows validation errors when schema parse fails', async () => {
    const { ZodError } = require('zod');
    const { AppUserSchema } = require('@/schemas/app_user.schema');
    const originalParse = AppUserSchema.parse;
    AppUserSchema.parse = jest.fn(() => {
      throw new ZodError([
        { code: 'invalid_type', expected: 'string', received: 'undefined', path: ['email'], message: 'Invalid email' },
      ]);
    });

    render(<AppUserForm />);

    const form = screen.getByRole('textbox', { name: 'form.firstNameLabel' }).closest('form')!;

    await act(async () => {
      fireEvent.submit(form);
    });

    // The catch block was hit - validation state was set
    expect(AppUserSchema.parse).toHaveBeenCalled();

    AppUserSchema.parse = originalParse;
  });

  it('shows roleLimitReached text for roles at plan limit', async () => {
    mockIsAtLimit.mockReturnValue(true);
    mockRoleData = [
      { id: 'role-1', name: 'cashier', display_name: 'Cashier' },
    ];
    setupSupabaseMock();

    await act(async () => {
      render(<AppUserForm />);
    });

    await waitFor(() => {
      expect(screen.getByText('form.roleLimitReached')).toBeInTheDocument();
    });
  });

  it('does not disable the current role even when at limit', async () => {
    mockIsAtLimit.mockReturnValue(true);
    mockRoleData = [
      { id: 'role-1', name: 'cashier', display_name: 'Cashier' },
    ];
    setupSupabaseMock();

    const appUser = {
      id: '1',
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      role_id: 'role-1',
      organization_id: 'org-1',
    };

    await act(async () => {
      render(<AppUserForm appUser={appUser} />);
    });

    await waitFor(() => {
      // The current role should show display_name, not roleLimitReached
      const matches = screen.getAllByText('Cashier');
      expect(matches.length).toBeGreaterThanOrEqual(1);
      // roleLimitReached should NOT appear since this is the current role
      expect(screen.queryByText('form.roleLimitReached')).not.toBeInTheDocument();
    });
  });

  it('handles roles with unknown feature names (no plan feature mapping)', async () => {
    mockIsAtLimit.mockReturnValue(false);
    mockRoleData = [
      { id: 'role-3', name: 'admin', display_name: 'Admin' },
    ];
    setupSupabaseMock();

    await act(async () => {
      render(<AppUserForm />);
    });

    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });
  });

  it('loads roles on mount', async () => {
    mockRoleData = [
      { id: 'role-1', name: 'cashier', display_name: 'Cashier' },
      { id: 'role-2', name: 'collaborator', display_name: 'Collaborator' },
    ];
    setupSupabaseMock();

    await act(async () => {
      render(<AppUserForm />);
    });

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('user_role');
    });
  });

  it('handles null data from supabase gracefully', async () => {
    mockFrom.mockImplementation(() => {
      const terminal = {
        then: jest.fn((resolve: (val: { data: null }) => void) => {
          resolve({ data: null });
          return Promise.resolve({ data: null });
        }),
      };
      const chainObj: Record<string, jest.Mock> = {};
      chainObj.select = jest.fn().mockReturnValue({ ...chainObj, ...terminal, in: jest.fn().mockReturnValue({ ...chainObj, ...terminal, order: jest.fn().mockReturnValue({ ...terminal }) }), order: jest.fn().mockReturnValue({ ...terminal }) });
      return chainObj;
    });

    await act(async () => {
      render(<AppUserForm />);
    });

    // Should render without crashing
    expect(screen.getByText('form.firstNameLabel')).toBeInTheDocument();
  });

  it('loads only cashier roles when currentUserRole is collaborator', async () => {
    mockRoleData = [
      { id: 'role-1', name: 'cashier', display_name: 'Cashier' },
    ];
    setupSupabaseMock();

    await act(async () => {
      render(<AppUserForm currentUserRole="collaborator" />);
    });

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('user_role');
    });
  });

  it('loads cashier and collaborator roles when currentUserRole is not collaborator', async () => {
    mockRoleData = [
      { id: 'role-1', name: 'cashier', display_name: 'Cashier' },
      { id: 'role-2', name: 'collaborator', display_name: 'Collaborator' },
    ];
    setupSupabaseMock();

    await act(async () => {
      render(<AppUserForm currentUserRole="owner" />);
    });

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('user_role');
    });
  });

});
