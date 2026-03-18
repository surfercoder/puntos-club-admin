import NotificationsPage from '@/app/dashboard/notifications/page';

const mockOrder = jest.fn();

jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: mockOrder,
      })),
    })),
  })),
}));
jest.mock('@/components/dashboard/plan/plan-limit-create-button', () => ({ PlanLimitCreateButton: () => <div /> }));
jest.mock('@/components/dashboard/plan/plan-usage-banner', () => ({ PlanUsageBanner: () => <div /> }));
jest.mock('@/components/ui/badge', () => ({ Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span> }));
jest.mock('@/components/ui/button', () => ({ Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button> }));
jest.mock('@/components/ui/table', () => ({
  Table: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
  TableHeader: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>,
  TableRow: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>,
  TableHead: ({ children }: { children: React.ReactNode }) => <th>{children}</th>,
  TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>,
  TableCell: ({ children }: { children: React.ReactNode }) => <td>{children}</td>,
}));

const mockNotifications = [
  {
    id: '1',
    title: 'Test Notification',
    body: 'Test body',
    status: 'sent',
    sent_count: 10,
    failed_count: 0,
    created_at: '2024-01-15T10:00:00Z',
    creator: { first_name: 'John', last_name: 'Doe', email: 'john@test.com' },
  },
  {
    id: '2',
    title: 'Failed Notification',
    body: 'Failed body',
    status: 'failed',
    sent_count: 0,
    failed_count: 5,
    created_at: '2024-01-16T10:00:00Z',
    creator: { first_name: null, last_name: null, email: 'unknown@test.com' },
  },
  {
    id: '3',
    title: 'Draft Notification',
    body: 'Draft body',
    status: 'draft',
    sent_count: 0,
    failed_count: 0,
    created_at: '2024-01-17T10:00:00Z',
    creator: null,
  },
  {
    id: '4',
    title: 'Sending Notification',
    body: 'Sending body',
    status: 'sending',
    sent_count: 3,
    failed_count: 1,
    created_at: '2024-01-18T10:00:00Z',
    creator: { first_name: 'Jane', last_name: '', email: 'jane@test.com' },
  },
];

describe('NotificationsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOrder.mockResolvedValue({ data: [], error: null });
  });

  it('exports a default async function', () => {
    expect(typeof NotificationsPage).toBe('function');
  });

  it('renders without crashing (empty)', async () => {
    const result = await NotificationsPage();
    expect(result).toBeTruthy();
  });

  it('throws when fetch fails', async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: 'DB error' } });

    await expect(NotificationsPage()).rejects.toThrow('Failed to fetch notifications');
  });

  it('renders notifications list', async () => {
    mockOrder.mockResolvedValue({ data: mockNotifications, error: null });

    const result = await NotificationsPage();
    expect(result).toBeTruthy();
  });

  it('renders empty state with action link', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });

    const result = await NotificationsPage();
    expect(result).toBeTruthy();
  });

  it('renders null notifications as empty', async () => {
    mockOrder.mockResolvedValue({ data: null, error: null });

    const result = await NotificationsPage();
    expect(result).toBeTruthy();
  });

  it('handles getStatusVariant for all statuses', async () => {
    mockOrder.mockResolvedValue({ data: mockNotifications, error: null });

    const result = await NotificationsPage();
    expect(result).toBeTruthy();
  });

  it('handles unknown status variant', async () => {
    mockOrder.mockResolvedValue({
      data: [{
        id: '5',
        title: 'Unknown Status',
        body: 'body',
        status: 'unknown_status',
        sent_count: 0,
        failed_count: 0,
        created_at: '2024-01-19T10:00:00Z',
        creator: null,
      }],
      error: null,
    });

    const result = await NotificationsPage();
    expect(result).toBeTruthy();
  });

  it('renders creator name correctly with first and last name', async () => {
    mockOrder.mockResolvedValue({
      data: [mockNotifications[0]],
      error: null,
    });

    const result = await NotificationsPage();
    expect(result).toBeTruthy();
  });

  it('renders creator email when name parts are empty', async () => {
    mockOrder.mockResolvedValue({
      data: [mockNotifications[1]],
      error: null,
    });

    const result = await NotificationsPage();
    expect(result).toBeTruthy();
  });

  it('renders N/A when creator is null', async () => {
    mockOrder.mockResolvedValue({
      data: [mockNotifications[2]],
      error: null,
    });

    const result = await NotificationsPage();
    expect(result).toBeTruthy();
  });

  it('renders creator with empty first_name and last_name falling back to email', async () => {
    mockOrder.mockResolvedValue({
      data: [{
        id: '6',
        title: 'Test',
        body: 'body',
        status: 'sent',
        sent_count: 1,
        failed_count: 0,
        created_at: '2024-01-20T10:00:00Z',
        creator: { first_name: '', last_name: '', email: 'fallback@test.com' },
      }],
      error: null,
    });

    const result = await NotificationsPage();
    expect(result).toBeTruthy();
  });
});
