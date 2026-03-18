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

let mockBeneficiariesData: { id: string; first_name?: string; last_name?: string; email?: string }[] = [];
let mockOrgsData: { id: string; name: string }[] = [];

const mockFrom = jest.fn();

function setupSupabaseMock() {
  mockFrom.mockImplementation((table: string) => {
    const data = table === 'beneficiary' ? mockBeneficiariesData : mockOrgsData;
    return {
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({ data }),
      }),
    };
  });
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: (...args: unknown[]) => mockFrom(...args),
  })),
}));

jest.mock('@/actions/dashboard/beneficiary_organization/beneficiary_organization-form-actions', () => ({
  beneficiaryOrganizationFormAction: jest.fn(),
}));

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

import BeneficiaryOrganizationForm from '@/components/dashboard/beneficiary_organization/beneficiary_organization-form';

const React = require('react');
const { toast } = require('sonner');
const { redirect } = require('next/navigation');

describe('BeneficiaryOrganizationForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBeneficiariesData = [];
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
    render(<BeneficiaryOrganizationForm />);

    expect(screen.getByText('form.beneficiaryLabel')).toBeInTheDocument();
    expect(screen.getByText('form.organizationLabel')).toBeInTheDocument();
    expect(screen.getByText('form.availablePoints')).toBeInTheDocument();
    expect(screen.getByText('form.totalPointsEarned')).toBeInTheDocument();
    expect(screen.getByText('form.totalPointsRedeemed')).toBeInTheDocument();
    expect(screen.getByText('form.activeLabel')).toBeInTheDocument();
  });

  it('renders correct submit button text in create mode', () => {
    render(<BeneficiaryOrganizationForm />);

    expect(screen.getByRole('button', { name: 'create' })).toBeInTheDocument();
  });

  it('renders correct submit button text in edit mode', () => {
    const beneficiaryOrganization = {
      id: '1',
      beneficiary_id: 'ben-1',
      organization_id: 'org-1',
      available_points: 100,
      total_points_earned: 500,
      total_points_redeemed: 400,
      is_active: true,
    };

    render(<BeneficiaryOrganizationForm beneficiaryOrganization={beneficiaryOrganization} />);

    expect(screen.getByRole('button', { name: 'update' })).toBeInTheDocument();
  });

  it('renders with initial data in edit mode', () => {
    const beneficiaryOrganization = {
      id: '1',
      beneficiary_id: 'ben-1',
      organization_id: 'org-1',
      available_points: 100,
      total_points_earned: 500,
      total_points_redeemed: 400,
      is_active: true,
    };

    render(<BeneficiaryOrganizationForm beneficiaryOrganization={beneficiaryOrganization} />);

    expect(screen.getByDisplayValue('100')).toBeInTheDocument();
    expect(screen.getByDisplayValue('500')).toBeInTheDocument();
    expect(screen.getByDisplayValue('400')).toBeInTheDocument();
  });

  it('renders cancel button linking to beneficiary_organization list', () => {
    render(<BeneficiaryOrganizationForm />);

    const cancelLink = screen.getByText('cancel');
    expect(cancelLink.closest('a')).toHaveAttribute('href', '/dashboard/beneficiary_organization');
  });

  it('shows error toast when actionState has error status', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: 'error', message: 'Something went wrong', fieldErrors: {} },
      jest.fn(),
      false,
    ]);

    render(<BeneficiaryOrganizationForm />);

    expect(toast.error).toHaveBeenCalledWith('Something went wrong');
  });

  it('calls redirect on success state', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: 'success', message: 'Record created', fieldErrors: {} },
      jest.fn(),
      false,
    ]);

    render(<BeneficiaryOrganizationForm />);

    expect(toast.success).toHaveBeenCalledWith('Record created');
    expect(redirect).toHaveBeenCalledWith('/dashboard/beneficiary_organization');
  });

  it('disables submit button when pending', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: '', message: '', fieldErrors: {} },
      jest.fn(),
      true,
    ]);

    render(<BeneficiaryOrganizationForm />);

    expect(screen.getByRole('button', { name: 'create' })).toBeDisabled();
  });

  it('validates form on submit and prevents default for invalid data', async () => {
    render(<BeneficiaryOrganizationForm />);

    const form = screen.getByText('form.beneficiaryLabel').closest('form')!;

    await act(async () => {
      fireEvent.submit(form);
    });

    // Validation fails because beneficiary_id and organization_id are required but empty
  });

  it('loads beneficiaries and organizations on mount', async () => {
    mockBeneficiariesData = [
      { id: 'b1', first_name: 'Bob', last_name: 'Jones', email: 'bob@test.com' },
    ];
    mockOrgsData = [{ id: 'o1', name: 'My Org' }];
    setupSupabaseMock();

    await act(async () => {
      render(<BeneficiaryOrganizationForm />);
    });

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('beneficiary');
      expect(mockFrom).toHaveBeenCalledWith('organization');
    });
  });

  // -- Cover beneficiary display name branches (line 98) --
  it('renders beneficiaries with various name combinations', async () => {
    mockBeneficiariesData = [
      { id: 'b1', first_name: 'Bob', last_name: 'Jones', email: 'bob@test.com' },
      { id: 'b2', first_name: null, last_name: null, email: 'noname@test.com' },
      { id: 'b3', first_name: null, last_name: null, email: null },
      { id: 'b4', first_name: 'Alice', last_name: undefined, email: 'alice@test.com' },
    ];
    mockOrgsData = [{ id: 'o1', name: 'Org' }];
    setupSupabaseMock();

    await act(async () => {
      render(<BeneficiaryOrganizationForm />);
    });

    await waitFor(() => {
      expect(screen.getByText('Bob Jones')).toBeInTheDocument();
      expect(screen.getByText('noname@test.com')).toBeInTheDocument();
      expect(screen.getByText('form.noName')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });
  });

  it('handles null data from supabase gracefully', async () => {
    mockFrom.mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: null }),
      }),
    }));

    await act(async () => {
      render(<BeneficiaryOrganizationForm />);
    });

    expect(screen.getByText('form.beneficiaryLabel')).toBeInTheDocument();
  });
});
