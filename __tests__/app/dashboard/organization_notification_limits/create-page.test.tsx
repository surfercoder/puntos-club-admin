import CreateOrganizationNotificationLimitPage from '@/app/dashboard/organization_notification_limits/create/page';

jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => Promise.resolve({ from: jest.fn(() => ({ select: jest.fn(() => ({ order: jest.fn().mockResolvedValue({ data: [{ id: '1', name: 'Org 1' }] }) })) })) })) }));
jest.mock('@/components/dashboard/organization_notification_limits/organization_notification_limit-form', () => function Mock() { return <div />; });
jest.mock('@/components/ui/card', () => ({ Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));

describe('CreateOrganizationNotificationLimitPage', () => {
  it('exports a default async function', () => { expect(typeof CreateOrganizationNotificationLimitPage).toBe('function'); });
  it('renders without crashing', async () => { const result = await CreateOrganizationNotificationLimitPage(); expect(result).toBeTruthy(); });

  it('renders with empty organizations list', async () => {
    const { createClient } = require('@/lib/supabase/server');
    createClient.mockResolvedValueOnce({
      from: jest.fn(() => ({ select: jest.fn(() => ({ order: jest.fn().mockResolvedValue({ data: null }) })) })),
    });
    const result = await CreateOrganizationNotificationLimitPage();
    expect(result).toBeTruthy();
  });
});
