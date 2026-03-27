jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));

const mockCookieStore = {
  get: jest.fn((name: string) => {
    if (name === 'active_org_id') return { value: '123' };
    return undefined;
  }),
  set: jest.fn(),
};
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => Promise.resolve(mockCookieStore)),
}));

const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  delete: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  gte: jest.fn(() => mockSupabase),
  lte: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase),
  single: jest.fn(() => ({ data: { id: 1, organization_id: 10, purchase_number: 'P-001', total_amount: '100.00', points_earned: 100, available_points: 200 }, error: null })),
  rpc: jest.fn(() => ({ data: 100, error: null })),
  auth: {
    getUser: jest.fn(() => ({
      data: { user: { id: 'auth-1', email: 'test@test.com' } },
      error: null,
    })),
  },
};
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => Promise.resolve(mockSupabase)) }));
jest.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: jest.fn(() => Promise.resolve({ id: 1, role: { name: 'owner' } })),
}));
jest.mock('@/lib/auth/roles', () => ({
  isAdmin: jest.fn(() => false),
}));

import { revalidatePath } from 'next/cache';
import {
  createPurchase,
  getBeneficiaryPurchases,
  getAllPurchases,
  getPurchaseById,
  verifyBeneficiary,
  getActivePointsRules,
  updatePurchase,
  deletePurchase,
} from '@/actions/dashboard/purchase/actions';
import { isAdmin } from '@/lib/auth/roles';

beforeEach(() => {
  jest.clearAllMocks();
  mockCookieStore.get.mockImplementation((name: string) => {
    if (name === 'active_org_id') return { value: '123' };
    return undefined;
  });
  mockSupabase.from.mockReturnValue(mockSupabase);
  mockSupabase.select.mockReturnValue(mockSupabase);
  mockSupabase.insert.mockReturnValue(mockSupabase);
  mockSupabase.update.mockReturnValue(mockSupabase);
  mockSupabase.delete.mockReturnValue(mockSupabase);
  mockSupabase.eq.mockReturnValue(mockSupabase);
  mockSupabase.gte.mockReturnValue(mockSupabase);
  mockSupabase.lte.mockReturnValue(mockSupabase);
  mockSupabase.order.mockReturnValue(mockSupabase);
  mockSupabase.single.mockReturnValue({
    data: { id: 1, organization_id: 10, purchase_number: 'P-001', total_amount: '100.00', points_earned: 100, available_points: 200 },
    error: null,
  });
  mockSupabase.rpc.mockReturnValue({ data: 100, error: null });
  mockSupabase.auth.getUser.mockReturnValue({
    data: { user: { id: 'auth-1', email: 'test@test.com' } },
    error: null,
  });
  (isAdmin as jest.Mock).mockReturnValue(false);
});

describe('createPurchase', () => {
  const validInput = {
    beneficiary_id: 1,
    cashier_id: 2,
    branch_id: 3,
    items: [{ item_name: 'Item', quantity: 2, unit_price: 50 }],
  };

  it('should create purchase successfully', async () => {
    const result = await createPurchase(validInput);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/purchases');
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/beneficiaries');
  });

  it('should return error when missing required fields', async () => {
    const result = await createPurchase({
      beneficiary_id: 0,
      cashier_id: 0,
      branch_id: 0,
      items: [],
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Missing required fields');
  });

  it('should return error when no items', async () => {
    const result = await createPurchase({
      beneficiary_id: 1,
      cashier_id: 2,
      branch_id: 3,
      items: [],
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe('At least one item is required');
  });

  it('should return error for invalid item data', async () => {
    const result = await createPurchase({
      beneficiary_id: 1,
      cashier_id: 2,
      branch_id: 3,
      items: [{ item_name: '', quantity: 0, unit_price: -1 }],
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid item data');
  });

  it('should return error when branch not found', async () => {
    mockSupabase.single.mockReturnValueOnce({ data: null, error: { message: 'Not found' } });
    const result = await createPurchase(validInput);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Branch not found');
  });

  it('should return error when points calculation fails', async () => {
    mockSupabase.rpc.mockReturnValue({ data: null, error: { message: 'RPC error' } });
    const result = await createPurchase(validInput);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to calculate points');
  });

  it('should return error when purchase insert fails', async () => {
    mockSupabase.single
      .mockReturnValueOnce({ data: { organization_id: 10 }, error: null }) // branch
      .mockReturnValueOnce({ data: null, error: { message: 'Insert failed' } }); // purchase
    const result = await createPurchase(validInput);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to create purchase');
  });

  it('should succeed with zero balance when beneficiary balance fetch fails', async () => {
    mockSupabase.single
      .mockReturnValueOnce({ data: { organization_id: 10 }, error: null }) // branch
      .mockReturnValueOnce({ data: { id: 1, purchase_number: 'P-001', total_amount: '100', points_earned: 100 }, error: null }) // purchase
      .mockReturnValueOnce({ data: null, error: { message: 'Not found' } }); // beneficiary
    const result = await createPurchase(validInput);
    expect(result.success).toBe(true);
    expect(result.data?.beneficiary_new_balance).toBe(0);
  });

  it('should handle unexpected errors', async () => {
    mockSupabase.from.mockImplementation(() => { throw new Error('Unexpected'); });
    const result = await createPurchase(validInput);
    expect(result).toEqual({ success: false, error: 'An unexpected error occurred' });
  });

  it('should handle zero points from rpc', async () => {
    mockSupabase.rpc.mockReturnValue({ data: null, error: null });
    mockSupabase.single
      .mockReturnValueOnce({ data: { organization_id: 10 }, error: null })
      .mockReturnValueOnce({ data: { id: 1, purchase_number: 'P-001', total_amount: '100', points_earned: 0 }, error: null })
      .mockReturnValueOnce({ data: { available_points: 0 }, error: null });
    const result = await createPurchase(validInput);
    expect(result.success).toBe(true);
  });
});

describe('getBeneficiaryPurchases', () => {
  it('should return purchases for beneficiary', async () => {
    mockSupabase.order.mockReturnValue({ data: [{ id: 1 }], error: null });
    const result = await getBeneficiaryPurchases(1);
    expect(result).toEqual({ success: true, data: [{ id: 1 }] });
  });

  it('should return error on failure', async () => {
    mockSupabase.order.mockReturnValue({ data: null, error: { message: 'Error' } });
    const result = await getBeneficiaryPurchases(1);
    expect(result).toEqual({ success: false, error: 'Error' });
  });

  it('should handle unexpected error', async () => {
    mockSupabase.from.mockImplementation(() => { throw new Error('Unexpected'); });
    const result = await getBeneficiaryPurchases(1);
    expect(result).toEqual({ success: false, error: 'An unexpected error occurred' });
  });
});

describe('getAllPurchases', () => {
  it('should return all purchases and filter by org for non-admin', async () => {
    const purchases = [
      { id: 1, branch: { organization_id: 123 } },
      { id: 2, branch: { organization_id: 999 } },
    ];
    mockSupabase.order.mockReturnValue({ data: purchases, error: null });
    const result = await getAllPurchases();
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
  });

  it('should return all purchases for admin without filtering', async () => {
    (isAdmin as jest.Mock).mockReturnValue(true);
    mockSupabase.order.mockReturnValue({ data: [{ id: 1 }, { id: 2 }], error: null });
    const result = await getAllPurchases();
    expect(result.data).toHaveLength(2);
  });

  it('should apply filters', async () => {
    // order returns mockSupabase for chaining; lte is the last filter and returns data
    mockSupabase.lte.mockReturnValueOnce({ data: [], error: null });
    await getAllPurchases({ branch_id: 1, start_date: '2024-01-01', end_date: '2024-12-31' });
    expect(mockSupabase.eq).toHaveBeenCalled();
    expect(mockSupabase.gte).toHaveBeenCalled();
    expect(mockSupabase.lte).toHaveBeenCalled();
  });

  it('should use organization_id filter when provided', async () => {
    mockSupabase.order.mockReturnValue({
      data: [{ id: 1, branch: { organization_id: 50 } }],
      error: null,
    });
    const result = await getAllPurchases({ organization_id: 50 });
    expect(result.data).toHaveLength(1);
  });

  it('should return error on failure', async () => {
    mockSupabase.order.mockReturnValue({ data: null, error: { message: 'Error' } });
    const result = await getAllPurchases();
    expect(result).toEqual({ success: false, error: 'Error' });
  });

  it('should handle unexpected error', async () => {
    mockSupabase.from.mockImplementation(() => { throw new Error('Unexpected'); });
    const result = await getAllPurchases();
    expect(result).toEqual({ success: false, error: 'An unexpected error occurred' });
  });

  it('should handle non-admin with no org', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    mockSupabase.order.mockReturnValue({ data: [{ id: 1 }], error: null });
    const result = await getAllPurchases();
    expect(result.data).toEqual([{ id: 1 }]);
  });
});

describe('getPurchaseById', () => {
  it('should return purchase by id', async () => {
    const result = await getPurchaseById(1);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should return error on failure', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'Not found' } });
    const result = await getPurchaseById(999);
    expect(result).toEqual({ success: false, error: 'Not found' });
  });

  it('should handle unexpected error', async () => {
    mockSupabase.from.mockImplementation(() => { throw new Error('Unexpected'); });
    const result = await getPurchaseById(1);
    expect(result).toEqual({ success: false, error: 'An unexpected error occurred' });
  });
});

describe('verifyBeneficiary', () => {
  it('should verify beneficiary by auth user email', async () => {
    mockSupabase.auth.getUser.mockReturnValue({
      data: { user: { id: 'auth-1', email: 'test@test.com' } },
      error: null,
    });
    const result = await verifyBeneficiary('some-user-id');
    expect(result.success).toBe(true);
  });

  it('should return error when not authenticated', async () => {
    mockSupabase.auth.getUser.mockReturnValue({ data: { user: null }, error: null });
    const result = await verifyBeneficiary('id');
    expect(result).toEqual({ success: false, error: 'Not authenticated' });
  });

  it('should return error when beneficiary not found', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'Not found' } });
    const result = await verifyBeneficiary('id');
    expect(result).toEqual({ success: false, error: 'Beneficiary not found' });
  });

  it('should handle unexpected error', async () => {
    mockSupabase.from.mockImplementation(() => { throw new Error('Unexpected'); });
    const result = await verifyBeneficiary('id');
    expect(result).toEqual({ success: false, error: 'An unexpected error occurred' });
  });
});

describe('getActivePointsRules', () => {
  it('should return active rules', async () => {
    mockSupabase.order.mockReturnValue({ data: [{ id: 1, is_active: true }], error: null });
    const result = await getActivePointsRules();
    expect(result).toEqual({ success: true, data: [{ id: 1, is_active: true }] });
  });

  it('should return error on failure', async () => {
    mockSupabase.order.mockReturnValue({ data: null, error: { message: 'Error' } });
    const result = await getActivePointsRules();
    expect(result).toEqual({ success: false, error: 'Error' });
  });

  it('should handle unexpected error', async () => {
    mockSupabase.from.mockImplementation(() => { throw new Error('Unexpected'); });
    const result = await getActivePointsRules();
    expect(result).toEqual({ success: false, error: 'An unexpected error occurred' });
  });
});

describe('updatePurchase', () => {
  it('should update purchase successfully', async () => {
    mockSupabase.single.mockReturnValue({ data: { id: '1', total_amount: '200.00' }, error: null });
    const result = await updatePurchase('1', { total_amount: '200.00' });
    expect(result).toEqual({ success: true, data: { id: '1', total_amount: '200.00' } });
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/purchase');
  });

  it('should return error on failure', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'Update failed' } });
    const result = await updatePurchase('1', { total_amount: '200.00' });
    expect(result).toEqual({ success: false, error: 'Update failed' });
  });

  it('should handle unexpected error', async () => {
    mockSupabase.from.mockImplementation(() => { throw new Error('Unexpected'); });
    const result = await updatePurchase('1', { total_amount: '200.00' });
    expect(result).toEqual({ success: false, error: 'An unexpected error occurred' });
  });
});

describe('deletePurchase', () => {
  it('should delete purchase successfully', async () => {
    mockSupabase.eq.mockReturnValue({ error: null });
    const result = await deletePurchase('1');
    expect(result).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/purchase');
  });

  it('should return error on failure', async () => {
    mockSupabase.eq.mockReturnValue({ error: { message: 'Delete failed' } });
    const result = await deletePurchase('1');
    expect(result).toEqual({ success: false, error: 'Delete failed' });
  });

  it('should handle unexpected error', async () => {
    mockSupabase.from.mockImplementation(() => { throw new Error('Unexpected'); });
    const result = await deletePurchase('1');
    expect(result).toEqual({ success: false, error: 'An unexpected error occurred' });
  });
});
