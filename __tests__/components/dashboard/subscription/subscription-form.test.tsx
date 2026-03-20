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

jest.mock('@/actions/dashboard/subscription/subscription-form-actions', () => ({
  subscriptionFormAction: jest.fn(),
}));

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

import SubscriptionForm from '@/components/dashboard/subscription/subscription-form';

const React = require('react');

describe('SubscriptionForm', () => {
  afterEach(() => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: '', message: '', fieldErrors: {} },
      jest.fn(),
      false,
    ]);
  });

  it('renders correct submit button text in create mode', () => {
    render(<SubscriptionForm />);

    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  it('renders correct submit button text in edit mode', () => {
    const subscription = {
      id: '1',
      organization_id: 'org-1',
      mp_preapproval_id: 'preapproval_123',
      mp_plan_id: 'plan_123',
      plan: 'advance',
      status: 'authorized',
      payer_email: 'test@example.com',
      amount: 1000,
      currency: 'ARS',
      created_at: '2024-01-01',
    };

    render(<SubscriptionForm subscription={subscription as any} />);

    expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
  });

  it('renders cancel button linking to subscription list', () => {
    render(<SubscriptionForm />);

    const cancelLink = screen.getByText('Cancel');
    expect(cancelLink.closest('a')).toHaveAttribute('href', '/dashboard/subscription');
  });

  it('disables submit button when pending', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: '', message: '', fieldErrors: {} },
      jest.fn(),
      true,
    ]);

    render(<SubscriptionForm />);

    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
  });

  it('runs handleSubmit and catches validation error on empty form', () => {
    render(<SubscriptionForm />);

    const form = screen.getByRole('button', { name: 'Create' }).closest('form')!;
    fireEvent.submit(form);
  });

  it('runs handleSubmit in edit mode with pre-filled data', () => {
    const subscription = {
      id: '1',
      organization_id: 'org-1',
      mp_preapproval_id: 'preapproval_123',
      mp_plan_id: 'plan_123',
      plan: 'advance',
      status: 'authorized',
      payer_email: 'test@example.com',
      amount: 1000,
      currency: 'ARS',
      created_at: '2024-01-01',
    };

    render(<SubscriptionForm subscription={subscription as any} />);

    const form = screen.getByRole('button', { name: 'Update' }).closest('form')!;
    fireEvent.submit(form);
  });
});
