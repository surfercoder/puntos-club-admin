import { render, screen, fireEvent } from '@testing-library/react';

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

jest.mock('@/actions/dashboard/organization/organization-form-actions', () => ({
  organizationFormAction: jest.fn(),
}));

jest.mock('@/components/ui/image-upload', () => ({
  ImageUpload: ({ onChange }: any) => (
    <div data-testid="image-upload">
      <button data-testid="upload-btn" onClick={() => onChange('https://example.com/logo.png')}>Upload</button>
      <button data-testid="clear-btn" onClick={() => onChange(null)}>Clear</button>
    </div>
  ),
}));

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

import OrganizationForm from '@/components/dashboard/organization/organization-form';

const React = require('react');
const { toast } = require('sonner');
const { redirect } = require('next/navigation');

describe('OrganizationForm', () => {
  afterEach(() => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: '', message: '', fieldErrors: {} },
      jest.fn(),
      false,
    ]);
  });

  it('renders the form with correct labels in create mode', () => {
    render(<OrganizationForm />);

    expect(screen.getByText('form.nameLabel')).toBeInTheDocument();
    expect(screen.getByText('form.legalName')).toBeInTheDocument();
    expect(screen.getByText('form.taxId')).toBeInTheDocument();
    expect(screen.getByText('form.logoLabel')).toBeInTheDocument();
  });

  it('renders the image upload component', () => {
    render(<OrganizationForm />);

    expect(screen.getByTestId('image-upload')).toBeInTheDocument();
  });

  it('renders correct submit button text in create mode', () => {
    render(<OrganizationForm />);

    expect(screen.getByRole('button', { name: 'create' })).toBeInTheDocument();
  });

  it('renders correct submit button text in edit mode', () => {
    const organization = {
      id: '1',
      name: 'Test Org',
      business_name: 'Test Org SRL',
      tax_id: 'CUIT-123',
      logo_url: null,
      created_at: '2024-01-01',
    };

    render(<OrganizationForm organization={organization} />);

    expect(screen.getByRole('button', { name: 'update' })).toBeInTheDocument();
  });

  it('renders with initial data in edit mode', () => {
    const organization = {
      id: '1',
      name: 'Test Org',
      business_name: 'Test Org SRL',
      tax_id: 'CUIT-123',
      logo_url: null,
      created_at: '2024-01-01',
    };

    render(<OrganizationForm organization={organization} />);

    expect(screen.getByDisplayValue('Test Org')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Org SRL')).toBeInTheDocument();
    expect(screen.getByDisplayValue('CUIT-123')).toBeInTheDocument();
  });

  it('renders without initial data in create mode', () => {
    render(<OrganizationForm />);

    const nameInput = screen.getByRole('textbox', { name: 'form.nameLabel' });
    expect(nameInput).toHaveValue('');
  });

  it('renders cancel button linking to organization list', () => {
    render(<OrganizationForm />);

    const cancelLink = screen.getByText('cancel');
    expect(cancelLink.closest('a')).toHaveAttribute('href', '/dashboard/organization');
  });

  it('shows error toast when actionState has error status', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: 'error', message: 'Something went wrong', fieldErrors: {} },
      jest.fn(),
      false,
    ]);

    render(<OrganizationForm />);

    expect(toast.error).toHaveBeenCalledWith('Something went wrong');
  });

  it('calls redirect on success state without onSuccess callback', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: 'success', message: 'Organization created', fieldErrors: {} },
      jest.fn(),
      false,
    ]);

    render(<OrganizationForm />);

    expect(toast.success).toHaveBeenCalledWith('Organization created');
    expect(redirect).toHaveBeenCalledWith('/dashboard/organization');
  });

  it('disables submit button when pending', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: '', message: '', fieldErrors: {} },
      jest.fn(),
      true,
    ]);

    render(<OrganizationForm />);

    expect(screen.getByRole('button', { name: 'create' })).toBeDisabled();
  });

  // -- onSuccess callback on success state (lines 40-41) --
  it('calls onSuccess callback on success state instead of redirect', () => {
    const onSuccessMock = jest.fn();

    (React.useActionState as jest.Mock).mockReturnValue([
      { status: 'success', message: 'Organization created', fieldErrors: {} },
      jest.fn(),
      false,
    ]);

    render(<OrganizationForm onSuccess={onSuccessMock} />);

    expect(toast.success).toHaveBeenCalledWith('Organization created');
    expect(onSuccessMock).toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  // -- onCancel callback (renders cancel button instead of link) --
  it('renders cancel button with onCancel callback', () => {
    const onCancelMock = jest.fn();

    render(<OrganizationForm onCancel={onCancelMock} />);

    // Should render a button instead of a link
    const cancelBtn = screen.getByRole('button', { name: 'cancel' });
    expect(cancelBtn).toBeInTheDocument();
    fireEvent.click(cancelBtn);
    expect(onCancelMock).toHaveBeenCalled();
  });

  // -- handleSubmit with logoUrl and validation (lines 54-67) --
  it('submits form with logo URL set', () => {
    render(<OrganizationForm />);

    // Set logo via mock upload
    fireEvent.click(screen.getByTestId('upload-btn'));

    // Fill in required fields
    fireEvent.change(screen.getByRole('textbox', { name: 'form.nameLabel' }), {
      target: { value: 'My Org' },
    });

    const form = screen.getByRole('button', { name: 'create' }).closest('form')!;
    fireEvent.submit(form);
  });

  it('prevents form submission on validation error', () => {
    render(<OrganizationForm />);

    // Submit with empty required fields
    const form = screen.getByRole('button', { name: 'create' }).closest('form')!;
    fireEvent.submit(form);

    // Should not crash, validation errors should be set
  });

  // -- Custom redirectTo --
  it('redirects to custom redirectTo on success without onSuccess', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: 'success', message: 'Done', fieldErrors: {} },
      jest.fn(),
      false,
    ]);

    render(<OrganizationForm redirectTo="/custom/path" />);

    expect(redirect).toHaveBeenCalledWith('/custom/path');
  });

  // -- Cover redirectTo=undefined fallback (line 49 ?? branch) --
  it('falls back to default redirect when redirectTo is undefined', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: 'success', message: 'Done', fieldErrors: {} },
      jest.fn(),
      false,
    ]);

    render(<OrganizationForm redirectTo={undefined} />);

    expect(redirect).toHaveBeenCalledWith('/dashboard/organization');
  });

  // -- Renders field errors --
  it('renders field errors from validation state', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: 'error', message: '', fieldErrors: { name: ['Name is required'] } },
      jest.fn(),
      false,
    ]);

    render(<OrganizationForm />);

    expect(screen.getByText('Name is required')).toBeInTheDocument();
  });
});
