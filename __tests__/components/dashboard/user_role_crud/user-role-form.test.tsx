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

jest.mock('@/actions/dashboard/user-role/user-role-form-actions', () => ({
  userRoleFormAction: jest.fn(),
}));

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

import UserRoleForm from '@/components/dashboard/user_role_crud/user-role-form';

const React = require('react');

describe('UserRoleForm', () => {
  afterEach(() => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: '', message: '', fieldErrors: {} },
      jest.fn(),
      false,
    ]);
  });

  it('renders correct submit button text in create mode', () => {
    render(<UserRoleForm />);

    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  it('renders correct submit button text in edit mode', () => {
    const userRole = {
      id: '1',
      name: 'admin',
      display_name: 'Administrator',
      description: 'Full access role',
      created_at: '2024-01-01',
    };

    render(<UserRoleForm userRole={userRole as any} />);

    expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
  });

  it('renders cancel button linking to user-role list', () => {
    render(<UserRoleForm />);

    const cancelLink = screen.getByText('Cancel');
    expect(cancelLink.closest('a')).toHaveAttribute('href', '/dashboard/user-role');
  });

  it('disables submit button when pending', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: '', message: '', fieldErrors: {} },
      jest.fn(),
      true,
    ]);

    render(<UserRoleForm />);

    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
  });

  it('runs handleSubmit and catches validation error on empty form', () => {
    render(<UserRoleForm />);

    const form = screen.getByRole('button', { name: 'Create' }).closest('form')!;
    fireEvent.submit(form);
  });

  it('runs handleSubmit in edit mode with pre-filled data', () => {
    const userRole = {
      id: '1',
      name: 'admin',
      display_name: 'Administrator',
      description: 'Full access role',
      created_at: '2024-01-01',
    };

    render(<UserRoleForm userRole={userRole as any} />);

    const form = screen.getByRole('button', { name: 'Update' }).closest('form')!;
    fireEvent.submit(form);
  });

  it('renders with initial data in edit mode', () => {
    const userRole = {
      id: '1',
      name: 'admin',
      display_name: 'Administrator',
      description: 'Full access role',
      created_at: '2024-01-01',
    };

    render(<UserRoleForm userRole={userRole as any} />);

    expect(screen.getByDisplayValue('Administrator')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Full access role')).toBeInTheDocument();
  });
});
