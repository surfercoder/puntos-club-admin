jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(() => ({ value: '123' })),
    set: jest.fn(),
  })),
}));

const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  delete: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase),
  single: jest.fn(() => ({ data: { id: '1' }, error: null })),
  rpc: jest.fn(() => ({ data: null, error: null })),
  auth: { getUser: jest.fn(() => ({ data: { user: { id: 'auth-1' } }, error: null })) },
};
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => mockSupabase) }));

import {
  createRedemption,
  updateRedemption,
  deleteRedemption,
  getRedemptions,
  getRedemption,
} from '@/actions/dashboard/redemption/actions';

beforeEach(() => {
  jest.clearAllMocks();
  mockSupabase.from.mockReturnValue(mockSupabase);
  mockSupabase.select.mockReturnValue(mockSupabase);
  mockSupabase.insert.mockReturnValue(mockSupabase);
  mockSupabase.update.mockReturnValue(mockSupabase);
  mockSupabase.delete.mockReturnValue(mockSupabase);
  mockSupabase.eq.mockReturnValue(mockSupabase);
  mockSupabase.order.mockReturnValue(mockSupabase);
  mockSupabase.single.mockReturnValue({ data: { id: '1' }, error: null });
});

const validRedemption = {
  beneficiary_id: '1',
  product_id: '2',

  points_used: 100,
};

describe('createRedemption', () => {
  it('should create redemption successfully', async () => {
    const result = await createRedemption(validRedemption);
    expect(mockSupabase.from).toHaveBeenCalledWith('redemption');
    expect(mockSupabase.insert).toHaveBeenCalled();
    expect(result.data).toBeDefined();
  });

  it('should return field errors on invalid input', async () => {
    const result = await createRedemption({ beneficiary_id: '', product_id: '', points_used: 0 } as any);
    expect(result.error).toHaveProperty('fieldErrors');
  });

  it('should return supabase error on failure', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'DB error' } });
    const result = await createRedemption(validRedemption);
    expect(result.error).toEqual({ message: 'DB error' });
  });
});

describe('createRedemption - points deduction', () => {
  const redemptionWithOrg = {
    beneficiary_id: '1',
    product_id: '2',
    points_used: 100,
    organization_id: '10',
  };

  it('should deduct points from beneficiary_organization when org and points are set', async () => {
    // First .single() call returns the inserted redemption, second returns membership
    let singleCallCount = 0;
    mockSupabase.single.mockImplementation(() => {
      singleCallCount++;
      if (singleCallCount === 1) {
        return { data: { id: '1' }, error: null };
      }
      // membership lookup
      return { data: { available_points: 500, total_points_redeemed: 200 }, error: null };
    });
    // The final update chain returns void (no .single())
    mockSupabase.eq.mockReturnValue(mockSupabase);

    const result = await createRedemption(redemptionWithOrg);
    expect(result.data).toBeDefined();
    expect(result.error).toBeNull();

    // Verify beneficiary_organization was queried
    expect(mockSupabase.from).toHaveBeenCalledWith('beneficiary_organization');
    // Verify update was called with deducted points
    expect(mockSupabase.update).toHaveBeenCalledWith({
      available_points: 400, // 500 - 100
      total_points_redeemed: 300, // 200 + 100
    });
  });

  it('should handle membership with null available_points and total_points_redeemed', async () => {
    let singleCallCount = 0;
    mockSupabase.single.mockImplementation(() => {
      singleCallCount++;
      if (singleCallCount === 1) {
        return { data: { id: '1' }, error: null };
      }
      // membership with null values
      return { data: { available_points: null, total_points_redeemed: null }, error: null };
    });

    const result = await createRedemption(redemptionWithOrg);
    expect(result.data).toBeDefined();
    expect(mockSupabase.update).toHaveBeenCalledWith({
      available_points: -100, // (0) - 100
      total_points_redeemed: 100, // (0) + 100
    });
  });

  it('should skip deduction when membership is null', async () => {
    let singleCallCount = 0;
    mockSupabase.single.mockImplementation(() => {
      singleCallCount++;
      if (singleCallCount === 1) {
        return { data: { id: '1' }, error: null };
      }
      // No membership found
      return { data: null, error: null };
    });

    await createRedemption(redemptionWithOrg);
    // update should not be called for beneficiary_organization
    expect(mockSupabase.update).not.toHaveBeenCalled();
  });

  it('should skip deduction when orgId or beneficiaryId is NaN', async () => {
    mockSupabase.single.mockReturnValue({ data: { id: '1' }, error: null });

    const result = await createRedemption({
      beneficiary_id: 'not-a-number',
      product_id: '2',
      points_used: 100,
      organization_id: 'not-a-number',
    });
    expect(result.data).toBeDefined();
    // beneficiary_organization should not be queried for membership
    const fromCalls = mockSupabase.from.mock.calls.map((c: any) => c[0]);
    // Only 'redemption' should be called, not 'beneficiary_organization'
    expect(fromCalls.filter((c: string) => c === 'beneficiary_organization')).toHaveLength(0);
  });

  it('should skip deduction when points_used is 0', async () => {
    mockSupabase.single.mockReturnValue({ data: { id: '1' }, error: null });

    await createRedemption({
      beneficiary_id: '1',
      product_id: '2',
      points_used: 0,
      organization_id: '10',
    });
    // points_used is 0, so the deduction block should be skipped
    const fromCalls = mockSupabase.from.mock.calls.map((c: any) => c[0]);
    expect(fromCalls.filter((c: string) => c === 'beneficiary_organization')).toHaveLength(0);
  });
});

describe('updateRedemption', () => {
  it('should update redemption successfully', async () => {
    const result = await updateRedemption('1', validRedemption);
    expect(mockSupabase.update).toHaveBeenCalled();
    expect(result.data).toBeDefined();
  });

  it('should return field errors on invalid input', async () => {
    const result = await updateRedemption('1', { beneficiary_id: '', product_id: '', points_used: 0 } as any);
    expect(result.error).toHaveProperty('fieldErrors');
  });
});

describe('createRedemption - empty path validation', () => {
  it('should skip validation errors with empty path[0]', async () => {
    const schema = require('@/schemas/redemption.schema').RedemptionSchema;
    const orig = schema.safeParse;
    schema.safeParse = jest.fn(() => ({
      success: false,
      error: { issues: [{ path: [], message: 'Root' }] },
    }));
    const result = await createRedemption({ beneficiary_id: '', product_id: '', points_used: 0 } as any);
    expect((result.error as { fieldErrors: Record<string, string> }).fieldErrors).toEqual({});
    schema.safeParse = orig;
  });
});

describe('updateRedemption - empty path validation', () => {
  it('should skip validation errors with empty path[0]', async () => {
    const schema = require('@/schemas/redemption.schema').RedemptionSchema;
    const orig = schema.safeParse;
    schema.safeParse = jest.fn(() => ({
      success: false,
      error: { issues: [{ path: [], message: 'Root' }] },
    }));
    const result = await updateRedemption('1', { beneficiary_id: '', product_id: '', points_used: 0 } as any);
    expect((result.error as { fieldErrors: Record<string, string> }).fieldErrors).toEqual({});
    schema.safeParse = orig;
  });
});

describe('deleteRedemption', () => {
  it('should delete redemption successfully', async () => {
    mockSupabase.eq.mockReturnValue({ error: null });
    const result = await deleteRedemption('1');
    expect(mockSupabase.delete).toHaveBeenCalled();
    expect(result.error).toBeNull();
  });

  it('should return supabase error on failure', async () => {
    mockSupabase.eq.mockReturnValue({ error: { message: 'Error' } });
    const result = await deleteRedemption('1');
    expect(result.error).toEqual({ message: 'Error' });
  });
});

describe('getRedemptions', () => {
  it('should return redemptions', async () => {
    mockSupabase.order.mockReturnValue({ data: [{ id: '1' }], error: null });
    const result = await getRedemptions();
    expect(result.data).toEqual([{ id: '1' }]);
  });

  it('should return error on failure', async () => {
    mockSupabase.order.mockReturnValue({ data: null, error: { message: 'Error' } });
    const result = await getRedemptions();
    expect(result.error).toEqual({ message: 'Error' });
  });
});

describe('getRedemption', () => {
  it('should return a redemption by id', async () => {
    const result = await getRedemption('1');
    expect(result.data).toBeDefined();
  });

  it('should return error on failure', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'Not found' } });
    const result = await getRedemption('999');
    expect(result.error).toBeDefined();
  });
});
