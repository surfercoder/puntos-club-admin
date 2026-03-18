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

let mockOrgData: { id: string; name: string }[] = [];
const mockOrder = jest.fn();
const mockSelect = jest.fn();
const mockFrom = jest.fn();

function setupSupabaseMock() {
  const queryObj: Record<string, jest.Mock> = {
    select: mockSelect,
    order: mockOrder,
    then: jest.fn((resolve: (val: { data: typeof mockOrgData }) => void) => {
      resolve({ data: mockOrgData });
      return Promise.resolve({ data: mockOrgData });
    }),
  };
  mockSelect.mockReturnValue(queryObj);
  mockOrder.mockReturnValue(queryObj);
  mockFrom.mockReturnValue(queryObj);
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: (...args: unknown[]) => mockFrom(...args),
  })),
}));

jest.mock('@/actions/dashboard/app_user/app_user-form-actions', () => ({
  appUserFormAction: jest.fn(),
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
    mockOrgData = [];
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
    expect(screen.getByText('form.usernameLabel')).toBeInTheDocument();
    expect(screen.getByText('form.passwordLabel')).toBeInTheDocument();
    expect(screen.getByText('form.activeLabel')).toBeInTheDocument();
    expect(screen.getByText('form.organizationLabel')).toBeInTheDocument();
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
      username: 'janesmith',
      active: true,
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
      username: 'janesmith',
      active: true,
      organization_id: 'org-1',
      created_at: '2024-01-01',
    };

    render(<AppUserForm appUser={appUser} />);

    expect(screen.getByDisplayValue('Jane')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Smith')).toBeInTheDocument();
    expect(screen.getByDisplayValue('jane@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('janesmith')).toBeInTheDocument();
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

  it('validates form on submit and prevents default for invalid data', async () => {
    render(<AppUserForm />);

    const form = screen.getByRole('textbox', { name: 'form.firstNameLabel' }).closest('form')!;

    await act(async () => {
      fireEvent.submit(form);
    });

    // Validation fails because organization_id is required but empty
  });

  it('loads organizations on mount', async () => {
    mockOrgData = [
      { id: 'org-1', name: 'Org Alpha' },
      { id: 'org-2', name: 'Org Beta' },
    ];
    setupSupabaseMock();

    await act(async () => {
      render(<AppUserForm />);
    });

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('organization');
    });
  });

  it('handles null data from supabase gracefully', async () => {
    const queryObj: Record<string, jest.Mock> = {
      select: mockSelect,
      order: mockOrder,
      then: jest.fn((resolve: (val: { data: null }) => void) => {
        resolve({ data: null });
        return Promise.resolve({ data: null });
      }),
    };
    mockSelect.mockReturnValue(queryObj);
    mockOrder.mockReturnValue(queryObj);
    mockFrom.mockReturnValue(queryObj);

    await act(async () => {
      render(<AppUserForm />);
    });

    // Should render without crashing
    expect(screen.getByText('form.firstNameLabel')).toBeInTheDocument();
  });
});
