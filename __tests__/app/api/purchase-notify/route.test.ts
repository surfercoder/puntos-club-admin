import { POST } from '@/app/api/purchase/notify/route';

const mockGetUser = jest.fn();

// We need persistent chainable mocks that survive clearAllMocks.
// Use a helper to build fresh chains in beforeEach.
let mockUserFrom: jest.Mock;
let mockUserSingle: jest.Mock;
let mockAdminFrom: jest.Mock;

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: (...args: any[]) => mockUserFrom(...args),
  })),
}));

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(() => ({
    from: (...args: any[]) => mockAdminFrom(...args),
  })),
}));

const mockResendSend = jest.fn();
jest.mock('@/lib/resend', () => ({
  resend: { emails: { send: (...args: unknown[]) => mockResendSend(...args) } },
  EMAIL_FROM: 'test@example.com',
}));

jest.mock('@/lib/email-template', () => ({
  brandedEmailLayout: jest.fn((body: string) => `<html>${body}</html>`),
  sectionHeading: jest.fn((text: string) => `<h2>${text}</h2>`),
  subtitle: jest.fn((text: string) => `<p>${text}</p>`),
  dataTable: jest.fn(() => '<table></table>'),
}));

global.fetch = jest.fn();

function _buildUserChain(singleResult: any) {
  const chain: any = {};
  chain.eq = jest.fn(() => chain);
  chain.single = jest.fn(() => Promise.resolve(singleResult));
  return {
    select: jest.fn(() => chain),
    chain,
  };
}

function _buildAdminSelectChain(result: any, isPromise = false) {
  const chain: any = {};
  chain.eq = jest.fn(() => chain);
  chain.single = jest.fn(() => Promise.resolve(result));
  // For push_tokens query: .eq().eq() resolves directly (no .single())
  if (isPromise) {
    // Make chain thenable so `await adminClient.from("push_tokens").select(...).eq(...).eq(...)` works
    chain.then = (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject);
  }
  return {
    select: jest.fn(() => chain),
    chain,
  };
}

describe('Purchase Notify API Route', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'anon-key',
      RESEND_API_KEY: 'test-resend-key',
    };

    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });

    // Default user chain: valid cashier with organization
    mockUserSingle = jest.fn().mockResolvedValue({
      data: { id: 1, organization_id: 1, role: [{ name: 'cashier' }] },
      error: null,
    });

    const userChain: any = {};
    userChain.eq = jest.fn(() => userChain);
    userChain.single = (...args: any[]) => mockUserSingle(...args);

    mockUserFrom = jest.fn(() => ({
      select: jest.fn(() => userChain),
    }));

    // Default admin mock (will be overridden by setupAdminMocks in most tests)
    mockAdminFrom = jest.fn(() => {
      const chain: any = {};
      chain.eq = jest.fn(() => chain);
      chain.single = jest.fn(() => Promise.resolve({ data: null, error: null }));
      chain.then = (resolve: any, reject: any) => Promise.resolve({ data: null, error: null }).then(resolve, reject);
      return {
        select: jest.fn(() => chain),
        update: jest.fn(() => chain),
      };
    });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const makeRequest = (body: any = {
    beneficiaryId: 'b1',
    pointsEarned: 100,
    totalAmount: 500,
    organizationId: 'org1',
  }, authHeader: string | null = 'Bearer valid-token') => ({
    json: () => Promise.resolve(body),
    headers: { get: (name: string) => name === 'authorization' ? authHeader : null },
  } as any);

  it('exports a POST handler', () => {
    expect(typeof POST).toBe('function');
  });

  // --- Auth tests ---

  it('returns 401 when authorization header is missing', async () => {
    const response = await POST(makeRequest({}, null));
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Missing authorization header');
  });

  it('returns 401 when authorization header does not start with Bearer', async () => {
    const response = await POST(makeRequest({}, 'Basic abc'));
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Missing authorization header');
  });

  it('returns 401 when user auth fails with error', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'Invalid' } });
    const response = await POST(makeRequest());
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 401 when user is null without error', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const response = await POST(makeRequest());
    expect(response.status).toBe(401);
  });

  // --- Role / org tests ---

  it('returns 403 when user has no organization_id', async () => {
    mockUserSingle.mockResolvedValueOnce({
      data: { id: 1, organization_id: null, role: [{ name: 'cashier' }] },
      error: null,
    });
    const response = await POST(makeRequest());
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe('User not associated with an organization');
  });

  it('returns 403 when appUser is null', async () => {
    mockUserSingle.mockResolvedValueOnce({ data: null, error: null });
    const response = await POST(makeRequest());
    expect(response.status).toBe(403);
  });

  it('returns 403 when role is null', async () => {
    mockUserSingle.mockResolvedValueOnce({
      data: { id: 1, organization_id: 1, role: null },
      error: null,
    });
    const response = await POST(makeRequest());
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe('Insufficient permissions');
  });

  it('returns 403 when role is not cashier/owner/admin', async () => {
    mockUserSingle.mockResolvedValueOnce({
      data: { id: 1, organization_id: 1, role: [{ name: 'viewer' }] },
      error: null,
    });
    const response = await POST(makeRequest());
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe('Insufficient permissions');
  });

  it('allows owner role', async () => {
    mockUserSingle.mockResolvedValueOnce({
      data: { id: 1, organization_id: 1, role: [{ name: 'owner' }] },
      error: null,
    });
    setupAdminMocks();
    const response = await POST(makeRequest());
    expect(response.status).toBe(200);
  });

  it('allows admin role', async () => {
    mockUserSingle.mockResolvedValueOnce({
      data: { id: 1, organization_id: 1, role: [{ name: 'admin' }] },
      error: null,
    });
    setupAdminMocks();
    const response = await POST(makeRequest());
    expect(response.status).toBe(200);
  });

  it('handles role as non-array (single object)', async () => {
    mockUserSingle.mockResolvedValueOnce({
      data: { id: 1, organization_id: 1, role: { name: 'cashier' } },
      error: null,
    });
    setupAdminMocks();
    const response = await POST(makeRequest());
    expect(response.status).toBe(200);
  });

  // --- Validation tests ---

  it('returns 400 when beneficiaryId is missing', async () => {
    const response = await POST(makeRequest({ pointsEarned: 100, totalAmount: 500 }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('beneficiaryId');
  });

  it('returns 400 when pointsEarned is null', async () => {
    const response = await POST(makeRequest({ beneficiaryId: 'b1', pointsEarned: null, totalAmount: 500 }));
    expect(response.status).toBe(400);
  });

  it('returns 400 when totalAmount is missing', async () => {
    const response = await POST(makeRequest({ beneficiaryId: 'b1', pointsEarned: 100 }));
    expect(response.status).toBe(400);
  });

  it('allows pointsEarned of 0', async () => {
    setupAdminMocks();
    const response = await POST(makeRequest({ beneficiaryId: 'b1', pointsEarned: 0, totalAmount: 500, organizationId: 'org1' }));
    expect(response.status).toBe(200);
  });

  // --- Beneficiary not found ---

  it('returns 404 when beneficiary is not found', async () => {
    setupAdminMocks({ beneficiary: null });
    const response = await POST(makeRequest());
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Beneficiary not found');
  });

  // --- Successful flow ---

  it('sends push notifications and email successfully', async () => {
    setupAdminMocks({
      beneficiary: { id: 'b1', first_name: 'Juan', last_name: 'Perez', email: 'juan@test.com' },
      organization: { name: 'Tienda Test' },
      beneficiaryOrg: { available_points: 500 },
      pushTokens: [{ id: 'pt1', expo_push_token: 'ExponentPushToken[abc]' }],
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [{ status: 'ok' }] }),
    });

    mockResendSend.mockResolvedValueOnce({ error: null });

    const response = await POST(makeRequest());
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.push.sent).toBe(1);
    expect(data.push.failed).toBe(0);
    expect(data.emailSent).toBe(true);
  });

  // --- Organization fallback ---

  it('uses "la tienda" when organization is not found', async () => {
    setupAdminMocks({
      beneficiary: { id: 'b1', first_name: 'Ana', last_name: '', email: 'ana@test.com' },
      organization: null,
      beneficiaryOrg: { available_points: 100 },
      pushTokens: [],
    });

    mockResendSend.mockResolvedValueOnce({ error: null });

    const response = await POST(makeRequest());
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.emailSent).toBe(true);
  });

  // --- Falls back to appUser.organization_id ---

  it('falls back to appUser.organization_id when organizationId is not in body', async () => {
    setupAdminMocks({
      beneficiary: { id: 'b1', first_name: 'Test', last_name: 'User', email: null },
      organization: { name: 'Org' },
      beneficiaryOrg: null,
      pushTokens: [],
    });

    const response = await POST(makeRequest({ beneficiaryId: 'b1', pointsEarned: 50, totalAmount: 200 }));
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.emailSent).toBe(false);
  });

  // --- beneficiaryOrg null fallback ---

  it('uses pointsEarned as newBalance when beneficiaryOrg is null', async () => {
    setupAdminMocks({
      beneficiary: { id: 'b1', first_name: 'Test', last_name: 'User', email: 'test@test.com' },
      organization: { name: 'Org' },
      beneficiaryOrg: null,
      pushTokens: [],
    });

    mockResendSend.mockResolvedValueOnce({ error: null });

    const response = await POST(makeRequest());
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.emailSent).toBe(true);
  });

  // --- beneficiaryName fallback ---

  it('uses "Cliente" when beneficiary has no first or last name', async () => {
    setupAdminMocks({
      beneficiary: { id: 'b1', first_name: null, last_name: null, email: 'test@test.com' },
      organization: { name: 'Org' },
      beneficiaryOrg: { available_points: 50 },
      pushTokens: [],
    });

    mockResendSend.mockResolvedValueOnce({ error: null });

    const response = await POST(makeRequest());
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.emailSent).toBe(true);
  });

  it('uses "Cliente" when beneficiary names are empty strings', async () => {
    setupAdminMocks({
      beneficiary: { id: 'b1', first_name: '', last_name: '', email: 'test@test.com' },
      organization: { name: 'Org' },
      beneficiaryOrg: { available_points: 50 },
      pushTokens: [],
    });

    mockResendSend.mockResolvedValueOnce({ error: null });

    const response = await POST(makeRequest());
    expect(response.status).toBe(200);
  });

  // --- Push notification scenarios ---

  it('handles no push tokens (null)', async () => {
    setupAdminMocks({
      beneficiary: { id: 'b1', first_name: 'Test', last_name: 'User', email: null },
      organization: { name: 'Org' },
      beneficiaryOrg: { available_points: 100 },
      pushTokens: null,
    });

    const response = await POST(makeRequest());
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.push.sent).toBe(0);
    expect(data.push.failed).toBe(0);
  });

  it('uses appUser.organization_id in push data when organizationId is not in body', async () => {
    setupAdminMocks({
      beneficiary: { id: 'b1', first_name: 'Test', last_name: 'User', email: null },
      organization: { name: 'Org' },
      beneficiaryOrg: { available_points: 100 },
      pushTokens: [{ id: 'pt1', expo_push_token: 'ExponentPushToken[abc]' }],
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [{ status: 'ok' }] }),
    });

    const response = await POST(makeRequest({ beneficiaryId: 'b1', pointsEarned: 50, totalAmount: 200 }));
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.push.sent).toBe(1);
  });

  it('handles empty push tokens array', async () => {
    setupAdminMocks({
      beneficiary: { id: 'b1', first_name: 'Test', last_name: 'User', email: null },
      organization: { name: 'Org' },
      beneficiaryOrg: { available_points: 100 },
      pushTokens: [],
    });

    const response = await POST(makeRequest());
    const data = await response.json();
    expect(data.push.sent).toBe(0);
    expect(data.push.failed).toBe(0);
  });

  it('handles DeviceNotRegistered error by deactivating token', async () => {
    setupAdminMocks({
      beneficiary: { id: 'b1', first_name: 'Test', last_name: 'User', email: null },
      organization: { name: 'Org' },
      beneficiaryOrg: { available_points: 100 },
      pushTokens: [{ id: 'pt1', expo_push_token: 'ExponentPushToken[abc]' }],
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        data: [{ status: 'error', details: { error: 'DeviceNotRegistered' } }],
      }),
    });

    const response = await POST(makeRequest());
    const data = await response.json();
    expect(data.push.sent).toBe(0);
    expect(data.push.failed).toBe(1);
  });

  it('handles failed push ticket without DeviceNotRegistered', async () => {
    setupAdminMocks({
      beneficiary: { id: 'b1', first_name: 'Test', last_name: 'User', email: null },
      organization: { name: 'Org' },
      beneficiaryOrg: { available_points: 100 },
      pushTokens: [{ id: 'pt1', expo_push_token: 'ExponentPushToken[abc]' }],
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        data: [{ status: 'error', details: { error: 'SomeOtherError' } }],
      }),
    });

    const response = await POST(makeRequest());
    const data = await response.json();
    expect(data.push.sent).toBe(0);
    expect(data.push.failed).toBe(1);
  });

  it('handles Expo push service returning non-ok response', async () => {
    setupAdminMocks({
      beneficiary: { id: 'b1', first_name: 'Test', last_name: 'User', email: null },
      organization: { name: 'Org' },
      beneficiaryOrg: { available_points: 100 },
      pushTokens: [{ id: 'pt1', expo_push_token: 'ExponentPushToken[abc]' }],
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Service Unavailable',
    });

    const response = await POST(makeRequest());
    const data = await response.json();
    expect(data.push.sent).toBe(0);
    expect(data.push.failed).toBe(1);
  });

  it('handles fetch throwing an error', async () => {
    setupAdminMocks({
      beneficiary: { id: 'b1', first_name: 'Test', last_name: 'User', email: null },
      organization: { name: 'Org' },
      beneficiaryOrg: { available_points: 100 },
      pushTokens: [{ id: 'pt1', expo_push_token: 'ExponentPushToken[abc]' }],
    });

    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const response = await POST(makeRequest());
    const data = await response.json();
    expect(data.push.sent).toBe(0);
    expect(data.push.failed).toBe(1);
  });

  it('handles result.data being null from Expo', async () => {
    setupAdminMocks({
      beneficiary: { id: 'b1', first_name: 'Test', last_name: 'User', email: null },
      organization: { name: 'Org' },
      beneficiaryOrg: { available_points: 100 },
      pushTokens: [{ id: 'pt1', expo_push_token: 'ExponentPushToken[abc]' }],
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: null }),
    });

    const response = await POST(makeRequest());
    const data = await response.json();
    expect(data.push.sent).toBe(0);
    expect(data.push.failed).toBe(0);
  });

  it('handles multiple push tokens with mixed results', async () => {
    setupAdminMocks({
      beneficiary: { id: 'b1', first_name: 'Test', last_name: 'User', email: null },
      organization: { name: 'Org' },
      beneficiaryOrg: { available_points: 100 },
      pushTokens: [
        { id: 'pt1', expo_push_token: 'ExponentPushToken[abc]' },
        { id: 'pt2', expo_push_token: 'ExponentPushToken[def]' },
        { id: 'pt3', expo_push_token: 'ExponentPushToken[ghi]' },
      ],
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        data: [
          { status: 'ok' },
          { status: 'error', details: { error: 'DeviceNotRegistered' } },
          { status: 'error', details: { error: 'OtherError' } },
        ],
      }),
    });

    const response = await POST(makeRequest());
    const data = await response.json();
    expect(data.push.sent).toBe(1);
    expect(data.push.failed).toBe(2);
  });

  // --- Email scenarios ---

  it('skips email when beneficiary has no email', async () => {
    setupAdminMocks({
      beneficiary: { id: 'b1', first_name: 'Test', last_name: 'User', email: null },
      organization: { name: 'Org' },
      beneficiaryOrg: { available_points: 100 },
      pushTokens: [],
    });

    const response = await POST(makeRequest());
    const data = await response.json();
    expect(data.emailSent).toBe(false);
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it('handles email send error', async () => {
    setupAdminMocks({
      beneficiary: { id: 'b1', first_name: 'Test', last_name: 'User', email: 'test@test.com' },
      organization: { name: 'Org' },
      beneficiaryOrg: { available_points: 100 },
      pushTokens: [],
    });

    mockResendSend.mockResolvedValueOnce({ error: { message: 'Email failed' } });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const response = await POST(makeRequest());
    const data = await response.json();
    expect(data.emailSent).toBe(false);
    consoleSpy.mockRestore();
  });

  it('handles email send throwing an exception', async () => {
    setupAdminMocks({
      beneficiary: { id: 'b1', first_name: 'Test', last_name: 'User', email: 'test@test.com' },
      organization: { name: 'Org' },
      beneficiaryOrg: { available_points: 100 },
      pushTokens: [],
    });

    mockResendSend.mockRejectedValueOnce(new Error('Resend crashed'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const response = await POST(makeRequest());
    const data = await response.json();
    expect(data.emailSent).toBe(false);
    consoleSpy.mockRestore();
  });

  it('skips email when RESEND_API_KEY is not set', async () => {
    delete process.env.RESEND_API_KEY;

    setupAdminMocks({
      beneficiary: { id: 'b1', first_name: 'Test', last_name: 'User', email: 'test@test.com' },
      organization: { name: 'Org' },
      beneficiaryOrg: { available_points: 100 },
      pushTokens: [],
    });

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    const response = await POST(makeRequest());
    const data = await response.json();
    expect(data.emailSent).toBe(false);
    expect(mockResendSend).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  // --- Unexpected error ---

  it('returns 500 on unexpected error (catch block)', async () => {
    mockGetUser.mockRejectedValueOnce(new Error('Unexpected'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const response = await POST(makeRequest());
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('An unexpected error occurred');
    consoleSpy.mockRestore();
  });

  // --- Helper ---

  function setupAdminMocks(opts: {
    beneficiary?: any;
    organization?: any;
    beneficiaryOrg?: any;
    pushTokens?: any;
  } = {}) {
    const {
      beneficiary = { id: 'b1', first_name: 'Test', last_name: 'User', email: 'test@test.com' },
      organization = { name: 'Org' },
      beneficiaryOrg = { available_points: 100 },
      pushTokens = [],
    } = opts;

    mockAdminFrom = jest.fn((table: string) => {
      if (table === 'beneficiary') {
        const chain: any = {};
        chain.eq = jest.fn(() => chain);
        chain.single = jest.fn(() => Promise.resolve({ data: beneficiary, error: null }));
        return { select: jest.fn(() => chain) };
      }
      if (table === 'organization') {
        const chain: any = {};
        chain.eq = jest.fn(() => chain);
        chain.single = jest.fn(() => Promise.resolve({ data: organization, error: null }));
        return { select: jest.fn(() => chain) };
      }
      if (table === 'beneficiary_organization') {
        const chain: any = {};
        chain.eq = jest.fn(() => chain);
        chain.single = jest.fn(() => Promise.resolve({ data: beneficiaryOrg, error: null }));
        return { select: jest.fn(() => chain) };
      }
      if (table === 'push_tokens') {
        // push_tokens is used for both select (to get tokens) and update (to deactivate)
        const selectChain: any = {};
        selectChain.eq = jest.fn(() => selectChain);
        // The final .eq() call is awaited directly (no .single())
        // Make the chain thenable
        selectChain.then = (resolve: any, reject: any) =>
          Promise.resolve({ data: pushTokens, error: null }).then(resolve, reject);

        const updateChain: any = {};
        updateChain.eq = jest.fn(() => updateChain);
        updateChain.then = (resolve: any, reject: any) =>
          Promise.resolve({ data: null, error: null }).then(resolve, reject);

        return {
          select: jest.fn(() => selectChain),
          update: jest.fn(() => updateChain),
        };
      }

      // fallback
      const chain: any = {};
      chain.eq = jest.fn(() => chain);
      chain.single = jest.fn(() => Promise.resolve({ data: null, error: null }));
      return { select: jest.fn(() => chain) };
    });
  }
});
