import { POST } from '@/app/api/notifications/send/route';

const mockGetUser = jest.fn();
const mockRpc = jest.fn().mockResolvedValue({});

// Build a chainable mock where every method returns the chain,
// and the chain itself is thenable (resolves to { data, error }).
const buildChainableMock = (resolveValue: any = { data: null, error: null }) => {
  const chain: any = {
    then: (resolve: any, reject: any) => Promise.resolve(resolveValue).then(resolve, reject),
  };
  chain.select = jest.fn(() => chain);
  chain.insert = jest.fn(() => chain);
  chain.update = jest.fn(() => chain);
  chain.eq = jest.fn(() => chain);
  chain.in = jest.fn(() => chain);
  chain.single = jest.fn(() => Promise.resolve(resolveValue));
  return chain;
};

let fromCallIndex = 0;
const mockFromResults: any[] = [];

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    auth: { getUser: mockGetUser },
    from: jest.fn(() => {
      const chain = mockFromResults[fromCallIndex] || buildChainableMock();
      fromCallIndex++;
      return chain;
    }),
    rpc: mockRpc,
  })),
}));

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(() => ({
    from: jest.fn(() => {
      const chain = mockFromResults[fromCallIndex] || buildChainableMock();
      fromCallIndex++;
      return chain;
    }),
    rpc: mockRpc,
  })),
}));

const mockCheckPlanLimit = jest.fn();
jest.mock('@/lib/plans/usage', () => ({
  checkPlanLimit: (...args: unknown[]) => mockCheckPlanLimit(...args),
}));

global.fetch = jest.fn();

describe('Notifications Send API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fromCallIndex = 0;
    mockFromResults.length = 0;
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    mockCheckPlanLimit.mockResolvedValue({ allowed: true });
  });

  const makeRequest = (body: any = { notificationId: 1 }) => ({
    json: () => Promise.resolve(body),
    headers: { get: () => null },
  } as any);

  it('exports a POST handler', () => {
    expect(typeof POST).toBe('function');
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'Not auth' } });
    const response = await POST(makeRequest());
    expect(response.status).toBe(401);
  });

  it('returns 403 when user has no organization and is not admin', async () => {
    const appUserChain = buildChainableMock({
      data: { id: 1, organization_id: null, role: [{ name: 'owner' }] },
      error: null,
    });
    mockFromResults.push(appUserChain);

    const response = await POST(makeRequest());
    expect(response.status).toBe(403);
  });

  it('returns 403 when user role is not owner or admin', async () => {
    const appUserChain = buildChainableMock({
      data: { id: 1, organization_id: 1, role: [{ name: 'cashier' }] },
      error: null,
    });
    mockFromResults.push(appUserChain);

    const response = await POST(makeRequest());
    expect(response.status).toBe(403);
  });

  it('returns 403 when user has no role', async () => {
    const appUserChain = buildChainableMock({
      data: { id: 1, organization_id: 1, role: null },
      error: null,
    });
    mockFromResults.push(appUserChain);

    const response = await POST(makeRequest());
    expect(response.status).toBe(403);
  });

  it('returns 400 when notificationId is missing', async () => {
    const appUserChain = buildChainableMock({
      data: { id: 1, organization_id: 1, role: [{ name: 'owner' }] },
      error: null,
    });
    mockFromResults.push(appUserChain);

    const response = await POST(makeRequest({}));
    expect(response.status).toBe(400);
  });

  it('returns 404 when notification not found', async () => {
    const appUserChain = buildChainableMock({
      data: { id: 1, organization_id: 1, role: [{ name: 'owner' }] },
      error: null,
    });
    mockFromResults.push(appUserChain);

    const notifChain = buildChainableMock({ data: null, error: { message: 'not found' } });
    mockFromResults.push(notifChain);

    const response = await POST(makeRequest());
    expect(response.status).toBe(404);
  });

  it('returns 400 when notification already sent', async () => {
    const appUserChain = buildChainableMock({
      data: { id: 1, organization_id: 1, role: [{ name: 'owner' }] },
      error: null,
    });
    mockFromResults.push(appUserChain);

    const notifChain = buildChainableMock({
      data: { id: 1, status: 'sent', organization_id: 1, title: 'Test', body: 'Body' },
      error: null,
    });
    mockFromResults.push(notifChain);

    const response = await POST(makeRequest());
    expect(response.status).toBe(400);
  });

  it('returns 429 when plan limit exceeded', async () => {
    const appUserChain = buildChainableMock({
      data: { id: 1, organization_id: 1, role: [{ name: 'owner' }] },
      error: null,
    });
    mockFromResults.push(appUserChain);

    const notifChain = buildChainableMock({
      data: { id: 1, status: 'draft', organization_id: 1, title: 'Test', body: 'Body' },
      error: null,
    });
    mockFromResults.push(notifChain);

    mockCheckPlanLimit.mockResolvedValueOnce({
      allowed: false,
      current_usage: 5,
      limit_value: 5,
      plan: 'trial',
    });

    const response = await POST(makeRequest());
    expect(response.status).toBe(429);
    const data = await response.json();
    expect(data.limit).toBeDefined();
  });

  it('returns success with 0 sent when no active beneficiaries', async () => {
    // appUser lookup
    mockFromResults.push(buildChainableMock({
      data: { id: 1, organization_id: 1, role: [{ name: 'owner' }] },
      error: null,
    }));
    // notification found
    mockFromResults.push(buildChainableMock({
      data: { id: 1, status: 'draft', organization_id: 1, title: 'Test', body: 'Body' },
      error: null,
    }));
    // update status to 'sending'
    mockFromResults.push(buildChainableMock());
    // beneficiary_organization query returns empty
    mockFromResults.push(buildChainableMock({ data: [], error: null }));
    // update notification status to 'sent'
    mockFromResults.push(buildChainableMock());

    const response = await POST(makeRequest());
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.sent).toBe(0);
    expect(data.message).toBe('No active beneficiaries to send to');
  });

  it('returns success with 0 sent when beneficiaryOrgs is null', async () => {
    mockFromResults.push(buildChainableMock({
      data: { id: 1, organization_id: 1, role: [{ name: 'owner' }] },
      error: null,
    }));
    mockFromResults.push(buildChainableMock({
      data: { id: 1, status: 'draft', organization_id: 1, title: 'Test', body: 'Body' },
      error: null,
    }));
    mockFromResults.push(buildChainableMock());
    // beneficiary_organization query returns null
    mockFromResults.push(buildChainableMock({ data: null, error: null }));
    mockFromResults.push(buildChainableMock());

    const response = await POST(makeRequest());
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.sent).toBe(0);
  });

  it('returns success with 0 sent when no push tokens found', async () => {
    mockFromResults.push(buildChainableMock({
      data: { id: 1, organization_id: 1, role: [{ name: 'owner' }] },
      error: null,
    }));
    mockFromResults.push(buildChainableMock({
      data: { id: 1, status: 'draft', organization_id: 1, title: 'Test', body: 'Body' },
      error: null,
    }));
    mockFromResults.push(buildChainableMock());
    // beneficiary_organization query returns some beneficiaries
    mockFromResults.push(buildChainableMock({
      data: [{ beneficiary_id: 1, beneficiary: { id: 1, first_name: 'John', last_name: 'Doe' } }],
      error: null,
    }));
    // push_tokens query - no tokens
    mockFromResults.push(buildChainableMock({ data: [], error: null }));
    // update notification status to 'sent'
    mockFromResults.push(buildChainableMock());

    const response = await POST(makeRequest());
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.sent).toBe(0);
    expect(data.message).toBe('No push tokens found for beneficiaries');
  });

  it('returns success with 0 sent when push tokens null', async () => {
    mockFromResults.push(buildChainableMock({
      data: { id: 1, organization_id: 1, role: [{ name: 'owner' }] },
      error: null,
    }));
    mockFromResults.push(buildChainableMock({
      data: { id: 1, status: 'draft', organization_id: 1, title: 'Test', body: 'Body' },
      error: null,
    }));
    mockFromResults.push(buildChainableMock());
    mockFromResults.push(buildChainableMock({
      data: [{ beneficiary_id: 1, beneficiary: { id: 1, first_name: 'John', last_name: 'Doe' } }],
      error: null,
    }));
    // push_tokens null
    mockFromResults.push(buildChainableMock({ data: null, error: null }));
    mockFromResults.push(buildChainableMock());

    const response = await POST(makeRequest());
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.sent).toBe(0);
  });

  it('sends push notifications successfully', async () => {
    mockFromResults.push(buildChainableMock({
      data: { id: 1, organization_id: 1, role: [{ name: 'owner' }] },
      error: null,
    }));
    mockFromResults.push(buildChainableMock({
      data: { id: 1, status: 'draft', organization_id: 1, title: 'Test Title', body: 'Test Body' },
      error: null,
    }));
    mockFromResults.push(buildChainableMock()); // update to 'sending'
    mockFromResults.push(buildChainableMock({
      data: [{ beneficiary_id: 1, beneficiary: { id: 1, first_name: 'John', last_name: 'Doe' } }],
      error: null,
    }));
    mockFromResults.push(buildChainableMock({
      data: [{ id: 1, beneficiary_id: 1, expo_push_token: 'ExponentPushToken[xxx]', is_active: true }],
      error: null,
    }));

    // Mock fetch for Expo push
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        data: [{ status: 'ok', id: 'ticket-1' }],
      }),
    });

    mockFromResults.push(buildChainableMock()); // update to 'sent'

    const response = await POST(makeRequest());
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.sent).toBe(1);
    expect(data.failed).toBe(0);
    expect(data.total).toBe(1);
  });

  it('handles failed push notification ticket (DeviceNotRegistered)', async () => {
    mockFromResults.push(buildChainableMock({
      data: { id: 1, organization_id: 1, role: [{ name: 'owner' }] },
      error: null,
    }));
    mockFromResults.push(buildChainableMock({
      data: { id: 1, status: 'draft', organization_id: 1, title: 'Test', body: 'Body' },
      error: null,
    }));
    mockFromResults.push(buildChainableMock()); // update to sending
    mockFromResults.push(buildChainableMock({
      data: [{ beneficiary_id: 1, beneficiary: { id: 1, first_name: 'John', last_name: 'Doe' } }],
      error: null,
    }));
    mockFromResults.push(buildChainableMock({
      data: [{ id: 1, beneficiary_id: 1, expo_push_token: 'ExponentPushToken[xxx]', is_active: true }],
      error: null,
    }));

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        data: [{ status: 'error', details: { error: 'DeviceNotRegistered' } }],
      }),
    });

    mockFromResults.push(buildChainableMock()); // deactivate push_token
    mockFromResults.push(buildChainableMock()); // update notification to sent

    const response = await POST(makeRequest());
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.failed).toBe(1);
  });

  it('handles failed push notification ticket (non-DeviceNotRegistered error)', async () => {
    mockFromResults.push(buildChainableMock({
      data: { id: 1, organization_id: 1, role: [{ name: 'owner' }] },
      error: null,
    }));
    mockFromResults.push(buildChainableMock({
      data: { id: 1, status: 'draft', organization_id: 1, title: 'Test', body: 'Body' },
      error: null,
    }));
    mockFromResults.push(buildChainableMock());
    mockFromResults.push(buildChainableMock({
      data: [{ beneficiary_id: 1, beneficiary: { id: 1, first_name: 'John', last_name: 'Doe' } }],
      error: null,
    }));
    mockFromResults.push(buildChainableMock({
      data: [{ id: 1, beneficiary_id: 1, expo_push_token: 'ExponentPushToken[xxx]', is_active: true }],
      error: null,
    }));

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        data: [{ status: 'error', details: { error: 'SomeOtherError' } }],
      }),
    });

    mockFromResults.push(buildChainableMock()); // update notification to sent

    const response = await POST(makeRequest());
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.failed).toBe(1);
  });

  it('handles Expo push service failure (fetch throws in sendPushNotifications)', async () => {
    mockFromResults.push(buildChainableMock({
      data: { id: 1, organization_id: 1, role: [{ name: 'owner' }] },
      error: null,
    }));
    mockFromResults.push(buildChainableMock({
      data: { id: 1, status: 'draft', organization_id: 1, title: 'Test', body: 'Body' },
      error: null,
    }));
    mockFromResults.push(buildChainableMock());
    mockFromResults.push(buildChainableMock({
      data: [{ beneficiary_id: 1, beneficiary: { id: 1, first_name: 'John', last_name: 'Doe' } }],
      error: null,
    }));
    mockFromResults.push(buildChainableMock({
      data: [{ id: 1, beneficiary_id: 1, expo_push_token: 'ExponentPushToken[xxx]', is_active: true }],
      error: null,
    }));

    // sendPushNotifications throws (response.ok is false => throw new Error)
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Service Unavailable',
    });

    mockFromResults.push(buildChainableMock()); // update notification to sent

    const response = await POST(makeRequest());
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.failed).toBe(1);
  });

  it('handles admin user sending notifications', async () => {
    mockFromResults.push(buildChainableMock({
      data: { id: 1, organization_id: null, role: [{ name: 'admin' }] },
      error: null,
    }));
    mockFromResults.push(buildChainableMock({
      data: { id: 1, status: 'draft', organization_id: 5, title: 'Admin Test', body: 'Admin Body' },
      error: null,
    }));
    mockFromResults.push(buildChainableMock()); // update to sending
    mockFromResults.push(buildChainableMock({ data: [], error: null })); // no beneficiaries
    mockFromResults.push(buildChainableMock()); // update to sent

    const response = await POST(makeRequest());
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.sent).toBe(0);
  });

  it('handles role as non-array (single object)', async () => {
    mockFromResults.push(buildChainableMock({
      data: { id: 1, organization_id: 1, role: { name: 'owner' } },
      error: null,
    }));
    mockFromResults.push(buildChainableMock({
      data: { id: 1, status: 'draft', organization_id: 1, title: 'Test', body: 'Body' },
      error: null,
    }));
    mockFromResults.push(buildChainableMock());
    mockFromResults.push(buildChainableMock({ data: null, error: null })); // no beneficiaries
    mockFromResults.push(buildChainableMock());

    const response = await POST(makeRequest());
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('returns 500 on unexpected error', async () => {
    mockGetUser.mockRejectedValueOnce(new Error('Unexpected'));

    const response = await POST(makeRequest());
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('An unexpected error occurred');
  });

  it('handles sendPushNotifications returning null data (line 201 false branch)', async () => {
    mockFromResults.push(buildChainableMock({
      data: { id: 1, organization_id: 1, role: [{ name: 'owner' }] },
      error: null,
    }));
    mockFromResults.push(buildChainableMock({
      data: { id: 1, status: 'draft', organization_id: 1, title: 'Test', body: 'Body' },
      error: null,
    }));
    mockFromResults.push(buildChainableMock()); // update to sending
    mockFromResults.push(buildChainableMock({
      data: [{ beneficiary_id: 1, beneficiary: { id: 1, first_name: 'John', last_name: 'Doe' } }],
      error: null,
    }));
    mockFromResults.push(buildChainableMock({
      data: [{ id: 1, beneficiary_id: 1, expo_push_token: 'ExponentPushToken[xxx]', is_active: true }],
      error: null,
    }));

    // Mock fetch to return response with null data
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: null }),
    });

    mockFromResults.push(buildChainableMock()); // update notification to sent

    const response = await POST(makeRequest());
    const data = await response.json();
    expect(data.success).toBe(true);
    // When result.data is null, the loop is skipped, so sent=0, failed=0
    expect(data.sent).toBe(0);
    expect(data.failed).toBe(0);
  });

  it('handles checkPlanLimit returning null (no limit configured)', async () => {
    mockFromResults.push(buildChainableMock({
      data: { id: 1, organization_id: 1, role: [{ name: 'owner' }] },
      error: null,
    }));
    mockFromResults.push(buildChainableMock({
      data: { id: 1, status: 'draft', organization_id: 1, title: 'Test', body: 'Body' },
      error: null,
    }));

    mockCheckPlanLimit.mockResolvedValueOnce(null);

    mockFromResults.push(buildChainableMock()); // update to sending
    mockFromResults.push(buildChainableMock({ data: null, error: null })); // no beneficiaries
    mockFromResults.push(buildChainableMock()); // update to sent

    const response = await POST(makeRequest());
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});
