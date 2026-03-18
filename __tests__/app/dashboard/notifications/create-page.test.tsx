import CreateNotificationPage from '@/app/dashboard/notifications/create/page';

jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => Promise.resolve({ auth: { getUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'u1' } } })) }, from: jest.fn(() => ({ select: jest.fn(() => ({ eq: jest.fn(() => ({ single: jest.fn().mockResolvedValue({ data: { organization_id: 1 } }) })) })) })), rpc: jest.fn().mockResolvedValue({ data: true }) })) }));
jest.mock('@/components/dashboard/notifications/notification-form', () => function Mock() { return <div />; });
jest.mock('@/components/dashboard/plan/plan-limit-guard', () => ({ PlanLimitGuard: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
jest.mock('@/components/ui/button', () => ({ Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button> }));

describe('CreateNotificationPage', () => {
  it('exports a default async function', () => { expect(typeof CreateNotificationPage).toBe('function'); });
  it('renders without crashing', async () => { const result = await CreateNotificationPage(); expect(result).toBeTruthy(); });
});
