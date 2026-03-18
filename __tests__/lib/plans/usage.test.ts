const mockRpc = jest.fn();
const mockSupabase = { rpc: mockRpc };

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

import {
  getOrganizationUsageSummary,
  checkPlanLimit,
  enforcePlanLimit,
} from '@/lib/plans/usage';

describe('getOrganizationUsageSummary', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns data on success', async () => {
    const mockData = { plan: 'pro', features: [] };
    mockRpc.mockResolvedValue({ data: mockData, error: null });

    const result = await getOrganizationUsageSummary(1);

    expect(result).toEqual(mockData);
    expect(mockRpc).toHaveBeenCalledWith('get_organization_usage_summary', { org_id: 1 });
  });

  it('returns null on error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'fail' } });

    const result = await getOrganizationUsageSummary(1);
    expect(result).toBeNull();
  });

  it('returns null when data is null', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const result = await getOrganizationUsageSummary(1);
    expect(result).toBeNull();
  });
});

describe('checkPlanLimit', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns data on success', async () => {
    const mockData = { allowed: true, current_usage: 3, limit_value: 10, plan: 'pro' };
    mockRpc.mockResolvedValue({ data: mockData, error: null });

    const result = await checkPlanLimit(1, 'branches');

    expect(result).toEqual(mockData);
    expect(mockRpc).toHaveBeenCalledWith('check_plan_limit', { org_id: 1, feature_name: 'branches' });
  });

  it('returns null on error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'fail' } });

    const result = await checkPlanLimit(1, 'branches');
    expect(result).toBeNull();
  });

  it('returns null when data is null', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const result = await checkPlanLimit(1, 'branches');
    expect(result).toBeNull();
  });
});

describe('enforcePlanLimit', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns null when action is allowed', async () => {
    mockRpc.mockResolvedValue({
      data: { allowed: true, current_usage: 3, limit_value: 10, plan: 'pro' },
      error: null,
    });

    const result = await enforcePlanLimit(1, 'branches');
    expect(result).toBeNull();
  });

  it('returns error ActionState when limit reached', async () => {
    mockRpc.mockResolvedValue({
      data: { allowed: false, current_usage: 5, limit_value: 5, plan: 'advance' },
      error: null,
    });

    const result = await enforcePlanLimit(1, 'branches');

    expect(result).not.toBeNull();
    expect(result!.status).toBe('error');
    expect(result!.message).toContain('Sucursales');
    expect(result!.message).toContain('5/5');
    expect(result!.message).toContain('advance');
  });

  it('returns null (fail open) when checkPlanLimit returns null', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'db error' } });

    const result = await enforcePlanLimit(1, 'cashiers');
    expect(result).toBeNull();
  });
});
