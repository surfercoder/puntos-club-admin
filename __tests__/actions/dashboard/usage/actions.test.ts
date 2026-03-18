jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn(() => ({ value: '123' })), set: jest.fn() })),
}));

const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  delete: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase),
  single: jest.fn(() => ({ data: { organization_id: 10 }, error: null })),
  rpc: jest.fn(() => ({ data: null, error: null })),
  auth: {
    getUser: jest.fn(() => ({
      data: { user: { id: 'auth-1' } },
      error: null,
    })),
  },
};
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => mockSupabase) }));
jest.mock('@/lib/plans/usage', () => ({
  getOrganizationUsageSummary: jest.fn(() => ({ plan: 'trial', features: {} })),
  checkPlanLimit: jest.fn(() => ({ allowed: true })),
}));

import { getUsageSummaryAction, checkFeatureLimitAction } from '@/actions/dashboard/usage/actions';
import { getOrganizationUsageSummary, checkPlanLimit } from '@/lib/plans/usage';

beforeEach(() => {
  jest.clearAllMocks();
  mockSupabase.from.mockReturnValue(mockSupabase);
  mockSupabase.select.mockReturnValue(mockSupabase);
  mockSupabase.eq.mockReturnValue(mockSupabase);
  mockSupabase.single.mockReturnValue({ data: { organization_id: 10 }, error: null });
  mockSupabase.auth.getUser.mockReturnValue({ data: { user: { id: 'auth-1' } }, error: null });
});

describe('getUsageSummaryAction', () => {
  it('should return usage summary when authenticated with org', async () => {
    const result = await getUsageSummaryAction();
    expect(getOrganizationUsageSummary).toHaveBeenCalledWith(10);
    expect(result).toEqual({ plan: 'trial', features: {} });
  });

  it('should return null when user not authenticated', async () => {
    mockSupabase.auth.getUser.mockReturnValue({ data: { user: null }, error: null });
    const result = await getUsageSummaryAction();
    expect(result).toBeNull();
  });

  it('should return null when user has no organization', async () => {
    mockSupabase.single.mockReturnValue({ data: { organization_id: null }, error: null });
    const result = await getUsageSummaryAction();
    expect(result).toBeNull();
  });

  it('should return null when app_user not found', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'Not found' } });
    const result = await getUsageSummaryAction();
    expect(result).toBeNull();
  });
});

describe('checkFeatureLimitAction', () => {
  it('should return limit check when authenticated with org', async () => {
    const result = await checkFeatureLimitAction('branches');
    expect(checkPlanLimit).toHaveBeenCalledWith(10, 'branches');
    expect(result).toEqual({ allowed: true });
  });

  it('should return null when user not authenticated', async () => {
    mockSupabase.auth.getUser.mockReturnValue({ data: { user: null }, error: null });
    const result = await checkFeatureLimitAction('branches');
    expect(result).toBeNull();
  });

  it('should return null when user has no organization', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: null });
    const result = await checkFeatureLimitAction('branches');
    expect(result).toBeNull();
  });
});
