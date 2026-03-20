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

jest.mock('@/actions/dashboard/plan_limits/plan-limit-form-actions', () => ({
  planLimitFormAction: jest.fn(),
}));

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

import PlanLimitForm from '@/components/dashboard/plan_limits/plan-limit-form';

const React = require('react');

describe('PlanLimitForm', () => {
  afterEach(() => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: '', message: '', fieldErrors: {} },
      jest.fn(),
      false,
    ]);
  });

  it('renders correct submit button text in create mode', () => {
    render(<PlanLimitForm />);

    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  it('renders correct submit button text in edit mode', () => {
    const planLimit = {
      id: '1',
      plan: 'trial',
      feature: 'beneficiaries',
      limit_value: 100,
      warning_threshold: 0.8,
      created_at: '2024-01-01',
    };

    render(<PlanLimitForm planLimit={planLimit as any} />);

    expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
  });

  it('renders cancel button linking to plan_limits list', () => {
    render(<PlanLimitForm />);

    const cancelLink = screen.getByText('Cancel');
    expect(cancelLink.closest('a')).toHaveAttribute('href', '/dashboard/plan_limits');
  });

  it('disables submit button when pending', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: '', message: '', fieldErrors: {} },
      jest.fn(),
      true,
    ]);

    render(<PlanLimitForm />);

    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
  });

  it('runs handleSubmit and catches validation error on empty form', () => {
    render(<PlanLimitForm />);

    const form = screen.getByRole('button', { name: 'Create' }).closest('form')!;
    fireEvent.submit(form);
  });

  it('runs handleSubmit in edit mode with pre-filled data', () => {
    const planLimit = {
      id: '1',
      plan: 'trial',
      feature: 'beneficiaries',
      limit_value: 100,
      warning_threshold: 0.8,
      created_at: '2024-01-01',
    };

    render(<PlanLimitForm planLimit={planLimit as any} />);

    const form = screen.getByRole('button', { name: 'Update' }).closest('form')!;
    fireEvent.submit(form);
  });
});
