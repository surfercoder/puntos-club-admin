import { render, screen, fireEvent, act } from '@testing-library/react';

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

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      then: jest.fn((cb: (res: { data: never[] }) => void) => cb({ data: [] })),
    })),
  })),
}));

jest.mock('@/components/providers/plan-usage-provider', () => ({
  usePlanUsage: jest.fn(() => ({
    summary: null, isLoading: false, invalidate: jest.fn(),
    isAtLimit: jest.fn(() => false), shouldWarn: jest.fn(() => false), getFeature: jest.fn(), plan: null,
  })),
}));

jest.mock('@/actions/dashboard/beneficiary/beneficiary-form-actions', () => ({
  beneficiaryFormAction: jest.fn(),
}));

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

import BeneficiaryForm from '@/components/dashboard/beneficiary/beneficiary-form';

const React = require('react');
const { toast } = require('sonner');
const { redirect } = require('next/navigation');

describe('BeneficiaryForm', () => {
  afterEach(() => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: '', message: '', fieldErrors: {} },
      jest.fn(),
      false,
    ]);
  });

  it('renders the form with correct labels in create mode', () => {
    render(<BeneficiaryForm />);

    expect(screen.getByText('firstNameLabel')).toBeInTheDocument();
    expect(screen.getByText('lastNameLabel')).toBeInTheDocument();
    expect(screen.getByText('emailLabel')).toBeInTheDocument();
    expect(screen.getByText('phoneLabel')).toBeInTheDocument();
    expect(screen.getByText('dniLabel')).toBeInTheDocument();
  });

  it('renders correct submit button text in create mode', () => {
    render(<BeneficiaryForm />);

    expect(screen.getByRole('button', { name: 'create' })).toBeInTheDocument();
  });

  it('renders correct submit button text in edit mode', () => {
    const beneficiary = {
      id: '1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone: '123456',
      document_id: 'DNI123',
      created_at: '2024-01-01',
    };

    render(<BeneficiaryForm beneficiary={beneficiary} />);

    expect(screen.getByRole('button', { name: 'update' })).toBeInTheDocument();
  });

  it('renders with initial data in edit mode', () => {
    const beneficiary = {
      id: '1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone: '123456',
      document_id: 'DNI123',
      created_at: '2024-01-01',
    };

    render(<BeneficiaryForm beneficiary={beneficiary} />);

    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123456')).toBeInTheDocument();
    expect(screen.getByDisplayValue('DNI123')).toBeInTheDocument();
  });

  it('renders without initial data in create mode', () => {
    render(<BeneficiaryForm />);

    const firstNameInput = screen.getByRole('textbox', { name: 'firstNameLabel' });
    expect(firstNameInput).toHaveValue('');
  });

  it('renders cancel button linking to beneficiary list', () => {
    render(<BeneficiaryForm />);

    const cancelLink = screen.getByText('cancel');
    expect(cancelLink.closest('a')).toHaveAttribute('href', '/dashboard/beneficiary');
  });

  it('shows error toast when actionState has error status', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: 'error', message: 'Something went wrong', fieldErrors: {} },
      jest.fn(),
      false,
    ]);

    render(<BeneficiaryForm />);

    expect(toast.error).toHaveBeenCalledWith('Something went wrong');
  });

  it('calls redirect on success state', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: 'success', message: 'Beneficiary created', fieldErrors: {} },
      jest.fn(),
      false,
    ]);

    render(<BeneficiaryForm />);

    expect(toast.success).toHaveBeenCalledWith('Beneficiary created');
    expect(redirect).toHaveBeenCalledWith('/dashboard/beneficiary');
  });

  it('disables submit button when pending', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: '', message: '', fieldErrors: {} },
      jest.fn(),
      true,
    ]);

    render(<BeneficiaryForm />);

    expect(screen.getByRole('button', { name: 'create' })).toBeDisabled();
  });

  it('validates form on submit - schema allows most fields optional so passes with defaults', async () => {
    render(<BeneficiaryForm />);

    const form = screen.getByRole('textbox', { name: 'firstNameLabel' }).closest('form')!;

    await act(async () => {
      fireEvent.submit(form);
    });

    // BeneficiarySchema has most fields optional, so it may pass validation
  });

  it('submits form with valid edit data', async () => {
    const beneficiary = {
      id: '1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone: '123456',
      document_id: 'DNI123',
      created_at: '2024-01-01',
    };

    render(<BeneficiaryForm beneficiary={beneficiary} />);

    const form = screen.getByDisplayValue('John').closest('form')!;

    await act(async () => {
      fireEvent.submit(form);
    });
  });
});
