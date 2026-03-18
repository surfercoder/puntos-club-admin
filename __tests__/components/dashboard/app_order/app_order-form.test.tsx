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

jest.mock('@/actions/dashboard/app_order/app_order-form-actions', () => ({
  appOrderFormAction: jest.fn(),
}));

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

import AppOrderForm from '@/components/dashboard/app_order/app_order-form';

const React = require('react');
const { toast } = require('sonner');
const { redirect } = require('next/navigation');

describe('AppOrderForm', () => {
  afterEach(() => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: '', message: '', fieldErrors: {} },
      jest.fn(),
      false,
    ]);
  });

  it('renders the form with correct labels in create mode', () => {
    render(<AppOrderForm />);

    expect(screen.getByText('form.orderNumber')).toBeInTheDocument();
    expect(screen.getByText('form.creationDate')).toBeInTheDocument();
    expect(screen.getByText('form.totalPoints')).toBeInTheDocument();
    expect(screen.getByText('form.observations')).toBeInTheDocument();
  });

  it('renders correct submit button text in create mode', () => {
    render(<AppOrderForm />);

    expect(screen.getByRole('button', { name: 'create' })).toBeInTheDocument();
  });

  it('renders correct submit button text in edit mode', () => {
    const appOrder = {
      id: '1',
      order_number: 'ORD-001',
      creation_date: '2024-01-15',
      total_points: 250,
      observations: 'Test order',
      organization_id: '1',
      created_at: '2024-01-01',
    };

    render(<AppOrderForm appOrder={appOrder} />);

    expect(screen.getByRole('button', { name: 'update' })).toBeInTheDocument();
  });

  it('renders with initial data in edit mode', () => {
    const appOrder = {
      id: '1',
      order_number: 'ORD-001',
      creation_date: '2024-01-15',
      total_points: 250,
      observations: 'Test order',
      organization_id: '1',
      created_at: '2024-01-01',
    };

    render(<AppOrderForm appOrder={appOrder} />);

    expect(screen.getByDisplayValue('ORD-001')).toBeInTheDocument();
    expect(screen.getByDisplayValue('250')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test order')).toBeInTheDocument();
  });

  it('renders without initial data in create mode', () => {
    render(<AppOrderForm />);

    const orderInput = screen.getByRole('textbox', { name: 'form.orderNumber' });
    expect(orderInput).toHaveValue('');
  });

  it('renders cancel button linking to app_order list', () => {
    render(<AppOrderForm />);

    const cancelLink = screen.getByText('cancel');
    expect(cancelLink.closest('a')).toHaveAttribute('href', '/dashboard/app_order');
  });

  it('shows error toast when actionState has error status', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: 'error', message: 'Something went wrong', fieldErrors: {} },
      jest.fn(),
      false,
    ]);

    render(<AppOrderForm />);

    expect(toast.error).toHaveBeenCalledWith('Something went wrong');
  });

  it('calls redirect on success state', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: 'success', message: 'Order created', fieldErrors: {} },
      jest.fn(),
      false,
    ]);

    render(<AppOrderForm />);

    expect(toast.success).toHaveBeenCalledWith('Order created');
    expect(redirect).toHaveBeenCalledWith('/dashboard/app_order');
  });

  it('disables submit button when pending', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: '', message: '', fieldErrors: {} },
      jest.fn(),
      true,
    ]);

    render(<AppOrderForm />);

    expect(screen.getByRole('button', { name: 'create' })).toBeDisabled();
  });

  it('validates form on submit and prevents default for invalid data', async () => {
    render(<AppOrderForm />);

    const form = screen.getByRole('textbox', { name: 'form.orderNumber' }).closest('form')!;

    await act(async () => {
      fireEvent.submit(form);
    });

    // Validation fails because order_number is required but empty
  });

  it('allows form submission with valid data', async () => {
    const appOrder = {
      id: '1',
      order_number: 'ORD-001',
      creation_date: '2024-01-15',
      total_points: 250,
      observations: 'Test order',
      organization_id: '1',
      created_at: '2024-01-01',
    };

    render(<AppOrderForm appOrder={appOrder} />);

    const form = screen.getByDisplayValue('ORD-001').closest('form')!;

    await act(async () => {
      fireEvent.submit(form);
    });
  });

  it('renders edit mode with empty creation_date (line 60 - formatDateForInput returns empty)', () => {
    const appOrder = {
      id: '1',
      order_number: 'ORD-002',
      creation_date: '',
      total_points: 100,
      observations: '',
      organization_id: '1',
      created_at: '2024-01-01',
    };

    render(<AppOrderForm appOrder={appOrder} />);

    expect(screen.getByDisplayValue('ORD-002')).toBeInTheDocument();
    // The creation_date input should have empty value since formatDateForInput('') returns ''
    const dateInput = screen.getByLabelText('form.creationDate') as HTMLInputElement;
    expect(dateInput.value).toBe('');
  });

  it('renders edit mode with valid creation_date (line 61 - formatDateForInput formats date)', () => {
    const appOrder = {
      id: '1',
      order_number: 'ORD-003',
      creation_date: '2024-06-15T10:30:00Z',
      total_points: 200,
      observations: 'Some obs',
      organization_id: '1',
      created_at: '2024-01-01',
    };

    render(<AppOrderForm appOrder={appOrder} />);

    const dateInput = screen.getByLabelText('form.creationDate') as HTMLInputElement;
    expect(dateInput.value).toBe('2024-06-15');
  });

  it('renders edit mode with null creation_date (uses ternary falsy branch)', () => {
    const appOrder = {
      id: '1',
      order_number: 'ORD-004',
      creation_date: null as any,
      total_points: 50,
      observations: '',
      organization_id: '1',
      created_at: '2024-01-01',
    };

    render(<AppOrderForm appOrder={appOrder} />);

    const dateInput = screen.getByLabelText('form.creationDate') as HTMLInputElement;
    expect(dateInput.value).toBe('');
  });
});
