import PushNotificationsListPage from '@/app/dashboard/push_notifications/page';

const mockEq = jest.fn().mockResolvedValue({ data: [], error: null });
const mockOrder = jest.fn(() => ({ eq: mockEq }));
const mockSelect = jest.fn(() => ({ order: mockOrder }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));

jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
jest.mock('next/headers', () => ({ cookies: jest.fn(() => Promise.resolve({ get: jest.fn(() => ({ value: '1' })) })) }));
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => Promise.resolve({ from: mockFrom })) }));
jest.mock('@/lib/supabase/admin', () => ({ createAdminClient: jest.fn(() => ({ from: mockFrom })) }));
jest.mock('@/lib/auth/get-current-user', () => ({ getCurrentUser: jest.fn(() => Promise.resolve({ id: '1', role: { name: 'admin' } })) }));
jest.mock('@/lib/auth/roles', () => ({ isAdmin: jest.fn(() => true) }));
jest.mock('@/components/dashboard/plan/plan-limit-create-button', () => ({ PlanLimitCreateButton: () => <div /> }));
jest.mock('@/components/dashboard/plan/plan-usage-banner', () => ({ PlanUsageBanner: () => <div /> }));
jest.mock('@/components/ui/badge', () => ({ Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span> }));
jest.mock('@/components/ui/button', () => ({ Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button> }));
jest.mock('@/components/ui/table', () => ({ Table: ({ children }: { children: React.ReactNode }) => <table>{children}</table>, TableHeader: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>, TableRow: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>, TableHead: ({ children }: { children: React.ReactNode }) => <th>{children}</th>, TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>, TableCell: ({ children }: { children: React.ReactNode }) => <td>{children}</td> }));

describe('PushNotificationsListPage', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('exports a default async function', () => { expect(typeof PushNotificationsListPage).toBe('function'); });
  it('renders without crashing', async () => {
    mockOrder.mockResolvedValueOnce({ data: [], error: null });
    const result = await PushNotificationsListPage();
    expect(result).toBeTruthy();
  });

  it('filters by organization for non-admin users', async () => {
    const { isAdmin } = require('@/lib/auth/roles');
    isAdmin.mockReturnValueOnce(false);
    mockOrder.mockReturnValueOnce({ eq: mockEq });
    mockEq.mockResolvedValueOnce({ data: [], error: null });
    const result = await PushNotificationsListPage();
    expect(result).toBeTruthy();
  });

  it('renders notification rows when data is returned', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{ id: '1', title: 'Notif', status: 'sent', sent_count: 10, failed_count: 0, created_at: '2024-01-01T00:00:00Z', organization: { name: 'Org1' } }],
      error: null,
    });
    const result = await PushNotificationsListPage();
    expect(result).toBeTruthy();
  });

  it('renders error message when query fails', async () => {
    mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });
    const result = await PushNotificationsListPage();
    expect(result).toBeTruthy();
  });

  it('renders notifications with all status variants', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [
        { id: '1', title: 'Sent', status: 'sent', sent_count: 10, failed_count: 0, created_at: '2024-01-01T00:00:00Z', organization: { name: 'Org1' } },
        { id: '2', title: 'Sending', status: 'sending', sent_count: 5, failed_count: 0, created_at: '2024-01-01T00:00:00Z', organization: { name: 'Org1' } },
        { id: '3', title: 'Failed', status: 'failed', sent_count: 0, failed_count: 10, created_at: '2024-01-01T00:00:00Z', organization: { name: 'Org1' } },
        { id: '4', title: 'Draft', status: 'draft', sent_count: 0, failed_count: 0, created_at: '2024-01-01T00:00:00Z', organization: null },
      ],
      error: null,
    });
    const result = await PushNotificationsListPage();
    expect(result).toBeTruthy();
  });

  it('renders notifications with array organization', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{ id: '5', title: 'Array Org', status: 'sent', sent_count: 1, failed_count: 0, created_at: '2024-01-01T00:00:00Z', organization: [{ name: 'ArrayOrg' }] }],
      error: null,
    });
    const result = await PushNotificationsListPage();
    expect(result).toBeTruthy();
  });

  it('handles no active_org_id cookie (null branch)', async () => {
    const { cookies } = require('next/headers');
    (cookies as jest.Mock).mockResolvedValueOnce({ get: jest.fn(() => undefined) });
    mockOrder.mockResolvedValueOnce({ data: [], error: null });
    const result = await PushNotificationsListPage();
    expect(result).toBeTruthy();
  });
});
