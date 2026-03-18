import { redirect } from 'next/navigation';
import AdminCreateNotificationPage from '@/app/dashboard/push_notifications/create/page';

jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
jest.mock('next/headers', () => ({ cookies: jest.fn(() => Promise.resolve({ get: jest.fn(() => ({ value: '1' })) })) }));
jest.mock('@/lib/auth/get-current-user', () => ({ getCurrentUser: jest.fn(() => Promise.resolve({ id: '1', role: { name: 'admin' } })) }));
jest.mock('@/lib/auth/roles', () => ({ isAdmin: jest.fn(() => true) }));
jest.mock('@/lib/supabase/admin', () => ({ createAdminClient: jest.fn(() => ({ from: jest.fn(() => ({ select: jest.fn(() => ({ eq: jest.fn(() => ({ single: jest.fn().mockResolvedValue({ data: { daily_limit: 10 } }) })) })) })), rpc: jest.fn().mockResolvedValue({ data: true }) })) }));
jest.mock('@/components/dashboard/notifications/notification-form', () => function Mock() { return <div />; });
jest.mock('@/components/dashboard/plan/plan-limit-guard', () => ({ PlanLimitGuard: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
jest.mock('@/components/ui/button', () => ({ Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button> }));

describe('AdminCreateNotificationPage', () => {
  it('exports a default async function', () => { expect(typeof AdminCreateNotificationPage).toBe('function'); });
  it('renders without crashing when admin', async () => { const result = await AdminCreateNotificationPage(); expect(result).toBeTruthy(); });

  it('redirects when not admin', async () => {
    const { isAdmin } = require('@/lib/auth/roles');
    isAdmin.mockReturnValueOnce(false);
    await AdminCreateNotificationPage();
    expect(redirect).toHaveBeenCalledWith('/dashboard/notifications/create');
  });

  it('renders with no active_org_id cookie (skips limits fetch)', async () => {
    const { cookies } = require('next/headers');
    (cookies as jest.Mock).mockResolvedValueOnce({ get: jest.fn(() => undefined) });
    const result = await AdminCreateNotificationPage();
    expect(result).toBeTruthy();
  });
});
