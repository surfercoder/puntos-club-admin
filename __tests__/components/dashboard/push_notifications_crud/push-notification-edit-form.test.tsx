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

jest.mock('@/actions/dashboard/push_notifications/push-notification-form-actions', () => ({
  pushNotificationFormAction: jest.fn(),
}));

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

import PushNotificationEditForm from '@/components/dashboard/push_notifications_crud/push-notification-edit-form';

const React = require('react');

const mockNotification = {
  id: '1',
  organization_id: 'org-1',
  created_by: 'user-1',
  title: 'Test',
  body: 'Body',
  status: 'draft',
  sent_count: 0,
  failed_count: 0,
};

describe('PushNotificationEditForm', () => {
  afterEach(() => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: '', message: '', fieldErrors: {} },
      jest.fn(),
      false,
    ]);
  });

  it('renders correct submit button text (always Update)', () => {
    render(<PushNotificationEditForm notification={mockNotification as any} />);

    expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
  });

  it('renders cancel button linking to push_notifications list', () => {
    render(<PushNotificationEditForm notification={mockNotification as any} />);

    const cancelLink = screen.getByText('Cancel');
    expect(cancelLink.closest('a')).toHaveAttribute('href', '/dashboard/push_notifications');
  });

  it('disables submit button when pending', () => {
    (React.useActionState as jest.Mock).mockReturnValue([
      { status: '', message: '', fieldErrors: {} },
      jest.fn(),
      true,
    ]);

    render(<PushNotificationEditForm notification={mockNotification as any} />);

    expect(screen.getByRole('button', { name: 'Update' })).toBeDisabled();
  });

  it('renders with initial data from notification prop', () => {
    render(<PushNotificationEditForm notification={mockNotification as any} />);

    expect(screen.getByDisplayValue('Test')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Body')).toBeInTheDocument();
  });

  it('runs handleSubmit in edit mode with pre-filled data', () => {
    render(<PushNotificationEditForm notification={mockNotification as any} />);

    const form = screen.getByRole('button', { name: 'Update' }).closest('form')!;
    fireEvent.submit(form);
  });
});
