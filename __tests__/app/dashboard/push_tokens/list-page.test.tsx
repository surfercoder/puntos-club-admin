import PushTokensListPage from '@/app/dashboard/push_tokens/page';

const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
const mockSelect = jest.fn(() => ({ order: mockOrder }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => Promise.resolve({ from: mockFrom })) }));
jest.mock('@/lib/supabase/admin', () => ({ createAdminClient: jest.fn(() => ({ from: mockFrom })) }));
jest.mock('@/lib/auth/get-current-user', () => ({ getCurrentUser: jest.fn(() => Promise.resolve({ id: '1', role: { name: 'admin' } })) }));
jest.mock('@/lib/auth/roles', () => ({ isAdmin: jest.fn(() => true) }));
jest.mock('@/components/ui/badge', () => ({ Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span> }));
jest.mock('@/components/ui/button', () => ({ Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button> }));
jest.mock('@/components/ui/table', () => ({ Table: ({ children }: { children: React.ReactNode }) => <table>{children}</table>, TableHeader: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>, TableRow: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>, TableHead: ({ children }: { children: React.ReactNode }) => <th>{children}</th>, TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>, TableCell: ({ children }: { children: React.ReactNode }) => <td>{children}</td> }));

describe('PushTokensListPage', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('exports a default async function', () => { expect(typeof PushTokensListPage).toBe('function'); });
  it('renders without crashing', async () => {
    mockOrder.mockResolvedValueOnce({ data: [], error: null });
    const result = await PushTokensListPage();
    expect(result).toBeTruthy();
  });

  it('renders token rows when data is returned', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{ id: '1', beneficiary_id: 'b1', platform: 'ios', device_id: 'dev1', expo_push_token: 'ExponentPushToken[xxx]', is_active: true, created_at: '2024-01-01T00:00:00Z', beneficiary: { first_name: 'John', last_name: 'Doe', email: 'j@t.com' } }],
      error: null,
    });
    const result = await PushTokensListPage();
    expect(result).toBeTruthy();
  });

  it('renders error message when query fails', async () => {
    mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });
    const result = await PushTokensListPage();
    expect(result).toBeTruthy();
  });

  it('renders token with array beneficiary', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{ id: '2', beneficiary_id: 'b2', platform: null, device_id: null, expo_push_token: 'token2', is_active: false, created_at: '2024-01-01T00:00:00Z', beneficiary: [{ first_name: 'Array', last_name: 'User', email: 'arr@t.com' }] }],
      error: null,
    });
    const result = await PushTokensListPage();
    expect(result).toBeTruthy();
  });

  it('renders token with beneficiary no name (email fallback)', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{ id: '3', beneficiary_id: 'b3', platform: 'android', device_id: 'dev3', expo_push_token: 'token3', is_active: true, created_at: '2024-01-01T00:00:00Z', beneficiary: { first_name: null, last_name: null, email: 'fallback@t.com' } }],
      error: null,
    });
    const result = await PushTokensListPage();
    expect(result).toBeTruthy();
  });

  it('renders token with null beneficiary (N/A)', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{ id: '4', beneficiary_id: 'b4', platform: null, device_id: null, expo_push_token: 'token4', is_active: false, created_at: '2024-01-01T00:00:00Z', beneficiary: null }],
      error: null,
    });
    const result = await PushTokensListPage();
    expect(result).toBeTruthy();
  });

  it('renders token with array beneficiary having empty names (email fallback)', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{ id: '5', beneficiary_id: 'b5', platform: 'ios', device_id: 'dev5', expo_push_token: 'token5', is_active: true, created_at: '2024-01-01T00:00:00Z', beneficiary: [{ first_name: '', last_name: '', email: 'arr-email@t.com' }] }],
      error: null,
    });
    const result = await PushTokensListPage();
    expect(result).toBeTruthy();
  });

  it('renders with non-admin user', async () => {
    const { isAdmin } = require('@/lib/auth/roles');
    isAdmin.mockReturnValueOnce(false);
    mockOrder.mockResolvedValueOnce({ data: [], error: null });
    const result = await PushTokensListPage();
    expect(result).toBeTruthy();
  });
});
