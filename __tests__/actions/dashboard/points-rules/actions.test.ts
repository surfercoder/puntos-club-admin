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
  cookies: jest.fn(() => mockCookieStore),
}));

const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  delete: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase),
  single: jest.fn(() => ({ data: { id: 1, name: 'Rule', organization_id: 123 }, error: null })),
  rpc: jest.fn(() => ({ data: 100, error: null })),
  auth: { getUser: jest.fn(() => ({ data: { user: { id: 'auth-1' } }, error: null })) },
};
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => mockSupabase) }));
jest.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: jest.fn(() => ({ id: 1, role: { name: 'owner' } })),
}));
jest.mock('@/lib/auth/roles', () => ({
  isAdmin: jest.fn(() => false),
}));

import { revalidatePath } from 'next/cache';
import {
  getAllPointsRules,
  getActivePointsRules,
  getPointsRuleById,
  createPointsRule,
  updatePointsRule,
  togglePointsRuleStatus,
  deletePointsRule,
  getActiveOffers,
  testPointsCalculation,
} from '@/actions/dashboard/points-rules/actions';
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
  mockSupabase.order.mockReturnValue(mockSupabase);
  mockSupabase.single.mockReturnValue({ data: { id: 1, name: 'Rule', organization_id: 123 }, error: null });
  mockSupabase.rpc.mockReturnValue({ data: 100, error: null });
  (isAdmin as jest.Mock).mockReturnValue(false);
});

const validRule = {
  name: 'Test Rule',
  rule_type: 'fixed_amount' as const,
  config: { points_per_unit: 1 },
};

describe('getAllPointsRules', () => {
  it('should return rules filtered by org for non-admin', async () => {
    // order returns mockSupabase for chaining, eq is the terminal call
    mockSupabase.eq.mockReturnValueOnce({ data: [{ id: 1 }], error: null });
    const result = await getAllPointsRules();
    expect(result).toEqual({ success: true, data: [{ id: 1 }] });
  });

  it('should return all rules for admin', async () => {
    (isAdmin as jest.Mock).mockReturnValue(true);
    mockSupabase.order.mockReturnValue({ data: [{ id: 1 }], error: null });
    const result = await getAllPointsRules();
    expect(result.success).toBe(true);
  });

  it('should return error on failure', async () => {
    // For non-admin, eq is terminal; mock eq to return error
    mockSupabase.eq.mockReturnValueOnce({ data: null, error: { message: 'Error' } });
    const result = await getAllPointsRules();
    expect(result).toEqual({ success: false, error: 'Error' });
  });

  it('should handle unexpected error', async () => {
    mockSupabase.from.mockImplementation(() => { throw new Error('Unexpected'); });
    const result = await getAllPointsRules();
    expect(result).toEqual({ success: false, error: 'An unexpected error occurred' });
  });

  it('should not filter by org for non-admin with no org cookie', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    mockSupabase.order.mockReturnValue({ data: [], error: null });
    const result = await getAllPointsRules();
    expect(result.success).toBe(true);
  });
});

describe('getActivePointsRules', () => {
  it('should return active rules', async () => {
    mockSupabase.order.mockReturnValue({ data: [{ id: 1 }], error: null });
    const result = await getActivePointsRules();
    expect(result).toEqual({ success: true, data: [{ id: 1 }] });
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

describe('getPointsRuleById', () => {
  it('should return rule by id', async () => {
    const result = await getPointsRuleById(1);
    expect(result.success).toBe(true);
  });

  it('should return error on failure', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'Not found' } });
    const result = await getPointsRuleById(999);
    expect(result).toEqual({ success: false, error: 'Not found' });
  });

  it('should handle unexpected error', async () => {
    mockSupabase.from.mockImplementation(() => { throw new Error('Unexpected'); });
    const result = await getPointsRuleById(1);
    expect(result).toEqual({ success: false, error: 'An unexpected error occurred' });
  });
});

describe('createPointsRule', () => {
  it('should create rule successfully', async () => {
    const result = await createPointsRule(validRule);
    expect(result.success).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/points-rules');
  });

  it('should return error when missing required fields', async () => {
    const result = await createPointsRule({ name: '', rule_type: '' as 'fixed_amount', config: {} });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Missing required fields');
  });

  it('should return error when no active org', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    const result = await createPointsRule(validRule);
    expect(result.success).toBe(false);
    expect(result.error).toBe('No active organization selected');
  });

  it('should validate branch belongs to org', async () => {
    mockSupabase.single.mockReturnValueOnce({ data: { id: 5, organization_id: 999 }, error: null });
    const result = await createPointsRule({ ...validRule, branch_id: 5 });
    expect(result.success).toBe(false);
    expect(result.error).toBe('Branch does not belong to active organization');
  });

  it('should return error when branch not found', async () => {
    // Line 162: branchError is truthy
    mockSupabase.single.mockReturnValueOnce({ data: null, error: { message: 'Not found' } });
    const result = await createPointsRule({ ...validRule, branch_id: 999 });
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not found');
  });

  it('should return error when branch not found and no error message', async () => {
    // Line 162: branchError is null but branchData is null
    mockSupabase.single.mockReturnValueOnce({ data: null, error: null });
    const result = await createPointsRule({ ...validRule, branch_id: 999 });
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid branch');
  });

  it('should return error when branch org mismatch in create', async () => {
    // Line 165: branchData.organization_id !== activeOrgIdNumber
    mockSupabase.single.mockReturnValueOnce({ data: { id: 5, organization_id: 999 }, error: null });
    const result = await createPointsRule({ ...validRule, branch_id: 5 });
    expect(result.success).toBe(false);
    expect(result.error).toBe('Branch does not belong to active organization');
  });

  it('should clear temporal fields when is_default is true', async () => {
    const result = await createPointsRule({ ...validRule, is_default: true, start_date: '2024-01-01' });
    expect(result.success).toBe(true);
  });

  it('should successfully create with branch_id that belongs to same org', async () => {
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: 5, organization_id: 123 }, error: null }) // branch check
      .mockReturnValueOnce({ data: { id: 1 }, error: null }); // insert
    const result = await createPointsRule({ ...validRule, branch_id: 5 });
    expect(result.success).toBe(true);
  });

  it('should return error on insert failure', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'Insert error' } });
    const result = await createPointsRule(validRule);
    expect(result).toEqual({ success: false, error: 'Insert error' });
  });

  it('should handle unexpected error', async () => {
    mockSupabase.from.mockImplementation(() => { throw new Error('Unexpected'); });
    const result = await createPointsRule(validRule);
    expect(result).toEqual({ success: false, error: 'An unexpected error occurred' });
  });
});

describe('updatePointsRule', () => {
  it('should update rule successfully', async () => {
    const result = await updatePointsRule(1, { name: 'Updated' });
    expect(result.success).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/points-rules');
  });

  it('should return error when no active org', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    const result = await updatePointsRule(1, { name: 'Updated' });
    expect(result.success).toBe(false);
    expect(result.error).toBe('No active organization selected');
  });

  it('should validate branch belongs to org when branch_id provided', async () => {
    mockSupabase.single.mockReturnValueOnce({ data: { id: 5, organization_id: 999 }, error: null });
    const result = await updatePointsRule(1, { branch_id: 5 });
    expect(result.success).toBe(false);
    expect(result.error).toBe('Branch does not belong to active organization');
  });

  it('should clear temporal fields when is_default is true', async () => {
    const result = await updatePointsRule(1, { is_default: true });
    expect(result.success).toBe(true);
  });

  it('should return error on update failure', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'Update error' } });
    const result = await updatePointsRule(1, { name: 'Updated' });
    expect(result).toEqual({ success: false, error: 'Update error' });
  });

  it('should handle unexpected error', async () => {
    mockSupabase.from.mockImplementation(() => { throw new Error('Unexpected'); });
    const result = await updatePointsRule(1, { name: 'Updated' });
    expect(result).toEqual({ success: false, error: 'An unexpected error occurred' });
  });

  it('should handle branch not found error', async () => {
    mockSupabase.single.mockReturnValueOnce({ data: null, error: null });
    const result = await updatePointsRule(1, { branch_id: 999 });
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid branch');
  });

  it('should handle branch fetch error in update', async () => {
    // Line 270-271: branchError is truthy
    mockSupabase.single.mockReturnValueOnce({ data: null, error: { message: 'DB error' } });
    const result = await updatePointsRule(1, { branch_id: 5 });
    expect(result.success).toBe(false);
    expect(result.error).toBe('DB error');
  });

  it('should handle branch org mismatch in update', async () => {
    // Line 274: branchData.organization_id !== activeOrgIdNumber
    mockSupabase.single.mockReturnValueOnce({ data: { id: 5, organization_id: 999 }, error: null });
    const result = await updatePointsRule(1, { branch_id: 5 });
    expect(result.success).toBe(false);
    expect(result.error).toBe('Branch does not belong to active organization');
  });

  it('should successfully validate branch_id that belongs to same org in update', async () => {
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: 5, organization_id: 123 }, error: null }) // branch check
      .mockReturnValueOnce({ data: { id: 1 }, error: null }); // update
    const result = await updatePointsRule(1, { branch_id: 5 });
    expect(result.success).toBe(true);
  });

  it('should skip branch validation when branch_id is null', async () => {
    const result = await updatePointsRule(1, { branch_id: undefined, name: 'Updated' });
    expect(result.success).toBe(true);
  });

  it('should set all update fields when all provided', async () => {
    // Lines 280-299: all updateData field assignments
    const result = await updatePointsRule(1, {
      name: 'Updated',
      description: 'Desc',
      rule_type: 'percentage',
      config: { pct: 10 },
      is_active: true,
      branch_id: undefined,
      category_id: 5,
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      is_default: false,
      priority: 10,
      valid_from: '2024-01-01',
      valid_until: '2024-12-31',
      days_of_week: [1, 2, 3],
      time_start: '09:00',
      time_end: '17:00',
      display_name: 'Test Rule',
      display_icon: '🎉',
      display_color: '#FF0000',
      show_in_app: true,
    });
    expect(result.success).toBe(true);
    expect(mockSupabase.update).toHaveBeenCalled();
  });
});

describe('togglePointsRuleStatus', () => {
  it('should toggle status successfully', async () => {
    const result = await togglePointsRuleStatus(1, true);
    expect(result.success).toBe(true);
    expect(mockSupabase.update).toHaveBeenCalledWith({ is_active: true });
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/points-rules');
  });

  it('should return error on failure', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'Error' } });
    const result = await togglePointsRuleStatus(1, false);
    expect(result).toEqual({ success: false, error: 'Error' });
  });

  it('should handle unexpected error', async () => {
    mockSupabase.from.mockImplementation(() => { throw new Error('Unexpected'); });
    const result = await togglePointsRuleStatus(1, true);
    expect(result).toEqual({ success: false, error: 'An unexpected error occurred' });
  });
});

describe('deletePointsRule', () => {
  it('should delete rule successfully', async () => {
    mockSupabase.eq.mockReturnValue({ error: null });
    const result = await deletePointsRule(1);
    expect(result).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/points-rules');
  });

  it('should return error on failure', async () => {
    mockSupabase.eq.mockReturnValue({ error: { message: 'Error' } });
    const result = await deletePointsRule(1);
    expect(result).toEqual({ success: false, error: 'Error' });
  });

  it('should handle unexpected error', async () => {
    mockSupabase.from.mockImplementation(() => { throw new Error('Unexpected'); });
    const result = await deletePointsRule(1);
    expect(result).toEqual({ success: false, error: 'An unexpected error occurred' });
  });
});

describe('getActiveOffers', () => {
  it('should return active offers', async () => {
    mockSupabase.rpc.mockReturnValue({ data: [{ id: 1 }], error: null });
    const result = await getActiveOffers(10, 5);
    expect(result).toEqual({ success: true, data: [{ id: 1 }] });
  });

  it('should handle no org/branch params', async () => {
    mockSupabase.rpc.mockReturnValue({ data: [], error: null });
    const result = await getActiveOffers();
    expect(result).toEqual({ success: true, data: [] });
  });

  it('should return error on failure', async () => {
    mockSupabase.rpc.mockReturnValue({ data: null, error: { message: 'Error' } });
    const result = await getActiveOffers();
    expect(result).toEqual({ success: false, error: 'Error' });
  });

  it('should handle unexpected error', async () => {
    mockSupabase.rpc.mockImplementation(() => { throw new Error('Unexpected'); });
    const result = await getActiveOffers();
    expect(result).toEqual({ success: false, error: 'An unexpected error occurred' });
  });
});

describe('testPointsCalculation', () => {
  it('should return calculated points', async () => {
    mockSupabase.rpc.mockReturnValue({ data: 50, error: null });
    const result = await testPointsCalculation(100, 10, 5, 3);
    expect(result).toEqual({ success: true, points: 50 });
  });

  it('should use active org from cookie when no orgId provided', async () => {
    mockSupabase.rpc.mockReturnValue({ data: 50, error: null });
    const result = await testPointsCalculation(100);
    expect(result.success).toBe(true);
  });

  it('should return error on failure', async () => {
    mockSupabase.rpc.mockReturnValue({ data: null, error: { message: 'Error' } });
    const result = await testPointsCalculation(100);
    expect(result).toEqual({ success: false, error: 'Error' });
  });

  it('should handle unexpected error', async () => {
    mockSupabase.rpc.mockImplementation(() => { throw new Error('Unexpected'); });
    const result = await testPointsCalculation(100);
    expect(result).toEqual({ success: false, error: 'An unexpected error occurred' });
  });

  it('should handle no org cookie and no orgId', async () => {
    // Lines 404-409: activeOrgId is undefined, parsedOrgId is NaN, activeOrgIdNumber is null
    mockCookieStore.get.mockReturnValue(undefined);
    mockSupabase.rpc.mockReturnValue({ data: 25, error: null });
    const result = await testPointsCalculation(100);
    expect(result).toEqual({ success: true, points: 25 });
  });

  it('should handle invalid org cookie', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'not-a-number' });
    mockSupabase.rpc.mockReturnValue({ data: 30, error: null });
    const result = await testPointsCalculation(100);
    expect(result).toEqual({ success: true, points: 30 });
  });
});
