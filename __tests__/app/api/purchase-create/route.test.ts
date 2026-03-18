import { POST } from '@/app/api/purchase/create/route';

const mockSingle = jest.fn();
const mockEq = jest.fn(() => ({ single: mockSingle }));
const mockSelect = jest.fn(() => ({ eq: mockEq }));
const mockInsertSingle = jest.fn();
const mockInsertSelect = jest.fn(() => ({ single: mockInsertSingle }));
const mockInsert = jest.fn(() => ({ select: mockInsertSelect }));
const mockFrom = jest.fn(() => ({ select: mockSelect, insert: mockInsert }));
const mockGetUser = jest.fn();
const mockRpc = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    auth: { getUser: mockGetUser },
    from: mockFrom,
    rpc: mockRpc,
  })),
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
    rpc: mockRpc,
  })),
}));

describe('Purchase Create API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'cashier@test.com' } }, error: null });
    // appUser lookup
    mockSingle.mockResolvedValue({ data: { id: 1, organization_id: 1 }, error: null });
    mockRpc.mockResolvedValue({ data: 200, error: null });
    mockInsertSingle.mockResolvedValue({
      data: { id: 1, purchase_number: 'P001', total_amount: '100', points_earned: 200 },
      error: null,
    });
  });

  it('exports a POST handler', () => {
    expect(typeof POST).toBe('function');
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'Not auth' } });

    const request = {
      json: () => Promise.resolve({ beneficiary_id: 1, branch_id: 1, amount: 100 }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('returns 404 when cashier profile not found', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

    const request = {
      json: () => Promise.resolve({ beneficiary_id: 1, branch_id: 1, amount: 100 }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toContain('Cashier profile not found');
  });

  it('returns 400 when required fields are missing', async () => {
    const request = {
      json: () => Promise.resolve({ amount: 100 }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('beneficiary_id or branch_id');
  });

  it('returns 400 for invalid amount', async () => {
    const request = {
      json: () => Promise.resolve({ beneficiary_id: 1, branch_id: 1, amount: -10 }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid purchase amount');
  });

  it('returns 400 for NaN amount', async () => {
    const request = {
      json: () => Promise.resolve({ beneficiary_id: 1, branch_id: 1, amount: 'not-a-number' }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('returns 400 when neither amount nor items provided', async () => {
    const request = {
      json: () => Promise.resolve({ beneficiary_id: 1, branch_id: 1 }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Either amount or items array is required');
  });

  it('returns 400 for invalid item data', async () => {
    const request = {
      json: () => Promise.resolve({
        beneficiary_id: 1,
        branch_id: 1,
        items: [{ item_name: '', quantity: 1, unit_price: 10 }],
      }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid item data');
  });

  it('creates purchase with items array (calculates total from items)', async () => {
    // appUser
    mockSingle.mockResolvedValueOnce({ data: { id: 1 }, error: null });
    // branch
    mockSingle.mockResolvedValueOnce({ data: { organization_id: 1 }, error: null });
    // beneficiary balance after purchase
    mockSingle.mockResolvedValueOnce({ data: { available_points: 300 }, error: null });

    const request = {
      json: () => Promise.resolve({
        beneficiary_id: 1,
        branch_id: 1,
        items: [
          { item_name: 'Item A', quantity: 2, unit_price: 50 },
          { item_name: 'Item B', quantity: 1, unit_price: 100 },
        ],
      }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('creates purchase with amount successfully', async () => {
    // appUser
    mockSingle.mockResolvedValueOnce({ data: { id: 1 }, error: null });
    // branch
    mockSingle.mockResolvedValueOnce({ data: { organization_id: 1 }, error: null });
    // beneficiary balance after purchase
    mockSingle.mockResolvedValueOnce({ data: { available_points: 300 }, error: null });

    const request = {
      json: () => Promise.resolve({ beneficiary_id: 1, branch_id: 1, amount: 100 }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.purchase_number).toBe('P001');
    expect(data.data.total_amount).toBe(100);
  });

  it('uses Bearer token auth for mobile apps', async () => {
    // appUser
    mockSingle.mockResolvedValueOnce({ data: { id: 1 }, error: null });
    // branch
    mockSingle.mockResolvedValueOnce({ data: { organization_id: 1 }, error: null });
    // beneficiary balance
    mockSingle.mockResolvedValueOnce({ data: { available_points: 300 }, error: null });

    const request = {
      json: () => Promise.resolve({ beneficiary_id: 1, branch_id: 1, amount: 50 }),
      headers: { get: (name: string) => name === 'authorization' ? 'Bearer mobile-token' : null },
    } as any;
    const response = await POST(request);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('returns 404 when branch not found', async () => {
    // appUser
    mockSingle.mockResolvedValueOnce({ data: { id: 1 }, error: null });
    // branch - not found
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

    const request = {
      json: () => Promise.resolve({ beneficiary_id: 1, branch_id: 999, amount: 100 }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Branch not found');
  });

  it('falls back to simple calculation when points RPC fails', async () => {
    // appUser
    mockSingle.mockResolvedValueOnce({ data: { id: 1 }, error: null });
    // branch
    mockSingle.mockResolvedValueOnce({ data: { organization_id: 1 }, error: null });
    // points RPC fails
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'RPC error' } });
    // beneficiary balance
    mockSingle.mockResolvedValueOnce({ data: { available_points: 300 }, error: null });

    const request = {
      json: () => Promise.resolve({ beneficiary_id: 1, branch_id: 1, amount: 100 }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('returns 500 when purchase insert fails', async () => {
    // appUser
    mockSingle.mockResolvedValueOnce({ data: { id: 1 }, error: null });
    // branch
    mockSingle.mockResolvedValueOnce({ data: { organization_id: 1 }, error: null });
    // purchase insert fails
    mockInsertSingle.mockResolvedValueOnce({ data: null, error: { message: 'Insert error' } });

    const request = {
      json: () => Promise.resolve({ beneficiary_id: 1, branch_id: 1, amount: 100 }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Failed to create purchase');
  });

  it('returns 500 on unexpected error (catch block)', async () => {
    mockGetUser.mockRejectedValueOnce(new Error('Unexpected'));

    const request = {
      json: () => Promise.resolve({ beneficiary_id: 1, branch_id: 1, amount: 100 }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('An unexpected error occurred');
  });

  it('handles beneficiary balance fetch error gracefully', async () => {
    // appUser
    mockSingle.mockResolvedValueOnce({ data: { id: 1 }, error: null });
    // branch
    mockSingle.mockResolvedValueOnce({ data: { organization_id: 1 }, error: null });
    // beneficiary balance - error
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

    const request = {
      json: () => Promise.resolve({ beneficiary_id: 1, branch_id: 1, amount: 100 }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.beneficiary_new_balance).toBe(0);
  });

  it('handles pointsData returning 0/null', async () => {
    // appUser
    mockSingle.mockResolvedValueOnce({ data: { id: 1 }, error: null });
    // branch
    mockSingle.mockResolvedValueOnce({ data: { organization_id: 1 }, error: null });
    // points RPC returns null
    mockRpc.mockResolvedValueOnce({ data: null, error: null });
    // beneficiary balance
    mockSingle.mockResolvedValueOnce({ data: { available_points: 50 }, error: null });

    const request = {
      json: () => Promise.resolve({ beneficiary_id: 1, branch_id: 1, amount: 100 }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});
