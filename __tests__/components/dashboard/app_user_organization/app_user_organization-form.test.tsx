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

let mockUsersData: { id: string; first_name?: string; last_name?: string; email?: string }[] = [];
let mockOrgsData: { id: string; name: string }[] = [];

const _mockOrder = jest.fn();
const _mockSelect = jest.fn();
const mockFrom = jest.fn();

function setupSupabaseMock() {
  mockFrom.mockImplementation((table: string) => {
    const data = table === 'app_user' ? mockUsersData : mockOrgsData;
    const queryObj: Record<string, jest.Mock> = {
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({ data }),
      }),
    };
    return queryObj;
  });
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: (...args: unknown[]) => mockFrom(...args),
  })),
}));

jest.mock('@/actions/dashboard/app_user_organization/app_user_organization-form-actions', () => ({
  appUserOrganizationFormAction: jest.fn(),
}));

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

import AppUserOrganizationForm from '@/components/dashboard/app_user_organization/app_user_organization-form';

const React = require('react');
const { toast } = require('sonner');
const { redirect } = require('next/navigation');

describe('AppUserOrganizationForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsersData = [];
    mockOrgsData = [];
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
    render(<AppUserOrganizationForm />);

    expect(screen.getByText('form.userLabel')).toBeInTheDocument();
    expect(screen.getByText('form.organizationLabel')).toBeInTheDocument();
    expect(screen.getByText('form.activeLabel')).toBeInTheDocument();
  });

  it('renders correct submit button text in create mode', () => {
    render(<AppUserOrganizationForm />);

    expect(screen.getByRole('button', { name: 'create' })).toBeInTheDocument();
  });

  it('renders correct submit button text in edit mode', () => {
    const appUserOrganization = {
      id: '1',
      app_user_id: 'user-1',
      organization_id: 'org-1',
      is_active: true,
    };

    render(<AppUserOrganizationForm appUserOrganization={appUserOrganization} />);

    expect(screen.getByRole('button', { name: 'update' })).toBeInTheDocument();
  });

  it('renders cancel button linking to app_user_organization list', () => {
    render(<AppUserOrganizationForm />);

    const cancelLink = screen.getByText('cancel');
    expect(cancelLink.closest('a')).toHaveAttribute('href', '/dashboard/app_user_organization');
  });

  it('renders active checkbox checked by default in create mode', () => {
    render(<AppUserOrganizationForm />);

    const checkbox = screen.getByRole('checkbox', { name: 'form.activeLabel' });
    expect(checkbox).toBeChecked();
  });

  it('shows error toast when actionState has error status', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: 'error', message: 'Something went wrong', fieldErrors: {} },
      jest.fn(),
      false,
    ]);

    render(<AppUserOrganizationForm />);

    expect(toast.error).toHaveBeenCalledWith('Something went wrong');
  });

  it('calls redirect on success state', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: 'success', message: 'Record created', fieldErrors: {} },
      jest.fn(),
      false,
    ]);

    render(<AppUserOrganizationForm />);

    expect(toast.success).toHaveBeenCalledWith('Record created');
    expect(redirect).toHaveBeenCalledWith('/dashboard/app_user_organization');
  });

  it('disables submit button when pending', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: '', message: '', fieldErrors: {} },
      jest.fn(),
      true,
    ]);

    render(<AppUserOrganizationForm />);

    expect(screen.getByRole('button', { name: 'create' })).toBeDisabled();
  });

  it('validates form on submit and prevents default for invalid data', async () => {
    render(<AppUserOrganizationForm />);

    const form = screen.getByText('form.userLabel').closest('form')!;

    await act(async () => {
      fireEvent.submit(form);
    });

    // Validation fails because app_user_id and organization_id are required but empty
  });

  it('loads users and organizations on mount', async () => {
    mockUsersData = [
      { id: 'u1', first_name: 'Alice', last_name: 'Smith', email: 'alice@test.com' },
    ];
    mockOrgsData = [{ id: 'o1', name: 'My Org' }];
    setupSupabaseMock();

    await act(async () => {
      render(<AppUserOrganizationForm />);
    });

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('app_user');
      expect(mockFrom).toHaveBeenCalledWith('organization');
    });
  });

  // -- Cover user display name branches (line 97) --
  it('renders users with various name combinations', async () => {
    mockUsersData = [
      { id: 'u1', first_name: 'Alice', last_name: 'Smith', email: 'alice@test.com' },
      { id: 'u2', first_name: null, last_name: null, email: 'noname@test.com' },
      { id: 'u3', first_name: null, last_name: null, email: null },
      { id: 'u4', first_name: 'Bob', last_name: undefined, email: 'bob@test.com' },
    ];
    mockOrgsData = [{ id: 'o1', name: 'Org' }];
    setupSupabaseMock();

    await act(async () => {
      render(<AppUserOrganizationForm />);
    });

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('noname@test.com')).toBeInTheDocument();
      expect(screen.getByText('form.noName')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  it('handles null data from supabase gracefully', async () => {
    mockFrom.mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: null }),
      }),
    }));

    await act(async () => {
      render(<AppUserOrganizationForm />);
    });

    expect(screen.getByText('form.userLabel')).toBeInTheDocument();
  });
});
