import { notFound } from 'next/navigation';
import EditNotificationPage from '@/app/dashboard/notifications/edit/[id]/page';

jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(() => Promise.resolve((key: string) => key)),
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    auth: { getUser: jest.fn(() => ({ data: { user: { id: 'u1' } } })) },
    from: jest.fn((table: string) => {
      if (table === 'app_user') return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: { organization_id: 'org-1' } })),
          })),
        })),
      };
      if (table === 'push_notifications') return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: { id: '1', title: 'Test' }, error: null })),
          })),
        })),
      };
      if (table === 'organization_notification_limits') return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null })),
          })),
        })),
      };
      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      };
    }),
    rpc: jest.fn(() => ({ data: true })),
  })),
}));

jest.mock('@/components/dashboard/notifications/notification-form', () => {
  return function MockNotificationForm() { return <div data-testid="notification-form" />; };
});

jest.mock('@/components/ui/button', () => ({
  Button: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('lucide-react', () => ({
  ArrowLeft: () => <div data-testid="arrow-left" />,
}));

describe('EditNotificationPage', () => {
  it('exports a default async function', () => {
    expect(typeof EditNotificationPage).toBe('function');
  });

  it('renders without crashing', async () => {
    const result = await EditNotificationPage({ params: Promise.resolve({ id: '1' }) });
    expect(result).toBeTruthy();
  });

  it('calls notFound when notification fetch fails', async () => {
    const { createClient } = require('@/lib/supabase/server');
    createClient.mockResolvedValueOnce({
      auth: { getUser: jest.fn(() => ({ data: { user: { id: 'u1' } } })) },
      from: jest.fn((table: string) => {
        if (table === 'app_user') return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: { organization_id: 'org-1' } })),
            })),
          })),
        };
        if (table === 'push_notifications') return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: null, error: { message: 'Not found' } })),
            })),
          })),
        };
        if (table === 'organization_notification_limits') return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: null })),
            })),
          })),
        };
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: null, error: null })),
            })),
          })),
        };
      }),
      rpc: jest.fn(() => ({ data: true })),
    });

    await EditNotificationPage({ params: Promise.resolve({ id: '999' }) });
    expect(notFound).toHaveBeenCalled();
  });

  it('calls notFound when notification data is null and no error', async () => {
    const { createClient } = require('@/lib/supabase/server');
    createClient.mockResolvedValueOnce({
      auth: { getUser: jest.fn(() => ({ data: { user: { id: 'u1' } } })) },
      from: jest.fn((table: string) => {
        if (table === 'app_user') return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: { organization_id: 'org-1' } })),
            })),
          })),
        };
        if (table === 'push_notifications') return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: null, error: null })),
            })),
          })),
        };
        if (table === 'organization_notification_limits') return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: null })),
            })),
          })),
        };
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: null, error: null })),
            })),
          })),
        };
      }),
      rpc: jest.fn(() => ({ data: true })),
    });

    await EditNotificationPage({ params: Promise.resolve({ id: '999' }) });
    expect(notFound).toHaveBeenCalled();
  });
});
