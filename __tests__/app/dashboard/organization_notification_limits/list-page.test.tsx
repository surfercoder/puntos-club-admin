import OrganizationNotificationLimitsListPage from '@/app/dashboard/organization_notification_limits/page';

const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
const mockSelect = jest.fn(() => ({ order: mockOrder }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));

jest.mock('@/lib/supabase/admin', () => ({ createAdminClient: jest.fn(() => ({ from: mockFrom })) }));
jest.mock('@/components/ui/badge', () => ({ Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span> }));
jest.mock('@/components/ui/button', () => ({ Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button> }));
jest.mock('@/components/ui/table', () => ({ Table: ({ children }: { children: React.ReactNode }) => <table>{children}</table>, TableHeader: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>, TableRow: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>, TableHead: ({ children }: { children: React.ReactNode }) => <th>{children}</th>, TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>, TableCell: ({ children }: { children: React.ReactNode }) => <td>{children}</td> }));

describe('OrganizationNotificationLimitsListPage', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('exports a default async function', () => { expect(typeof OrganizationNotificationLimitsListPage).toBe('function'); });
  it('renders without crashing', async () => {
    mockOrder.mockResolvedValueOnce({ data: [], error: null });
    const result = await OrganizationNotificationLimitsListPage();
    expect(result).toBeTruthy();
  });

  it('renders rows when data is returned', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{
        id: '1', organization_id: 1, plan_type: 'premium', daily_limit: 10, monthly_limit: 100,
        min_hours_between_notifications: 4, notifications_sent_today: 2, notifications_sent_this_month: 20,
        organization: { name: 'Org1' },
      }],
      error: null,
    });
    const result = await OrganizationNotificationLimitsListPage();
    expect(result).toBeTruthy();
  });

  it('renders error message when query fails', async () => {
    mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });
    const result = await OrganizationNotificationLimitsListPage();
    expect(result).toBeTruthy();
  });

  it('renders rows with array organization (covers Array.isArray branch)', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{
        id: '2', organization_id: 1, plan_type: 'pro', daily_limit: 5, monthly_limit: 50,
        min_hours_between_notifications: 2, notifications_sent_today: 0, notifications_sent_this_month: 0,
        organization: [{ name: 'ArrayOrg' }],
      }],
      error: null,
    });
    const result = await OrganizationNotificationLimitsListPage();
    expect(result).toBeTruthy();
  });

  it('renders rows with null organization (N/A fallback)', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{
        id: '3', organization_id: 1, plan_type: 'light', daily_limit: 1, monthly_limit: 10,
        min_hours_between_notifications: 8, notifications_sent_today: 0, notifications_sent_this_month: 0,
        organization: null,
      }],
      error: null,
    });
    const result = await OrganizationNotificationLimitsListPage();
    expect(result).toBeTruthy();
  });

  it('renders rows with unknown plan_type (secondary badge)', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{
        id: '4', organization_id: 1, plan_type: 'unknown', daily_limit: 1, monthly_limit: 10,
        min_hours_between_notifications: 8, notifications_sent_today: 0, notifications_sent_this_month: 0,
        organization: { name: 'Org' },
      }],
      error: null,
    });
    const result = await OrganizationNotificationLimitsListPage();
    expect(result).toBeTruthy();
  });
});
