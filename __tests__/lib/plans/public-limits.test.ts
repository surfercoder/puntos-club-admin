const mockSelect = jest.fn();
const mockFrom = jest.fn(() => ({ select: mockSelect }));
const mockCreateAdminClient = jest.fn(() => ({ from: mockFrom }));

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => mockCreateAdminClient(),
}));

import { getPublicPlanLimits } from '@/lib/plans/public-limits';

describe('getPublicPlanLimits', () => {
  it('groups rows by plan and feature', async () => {
    mockSelect.mockResolvedValue({
      data: [
        { plan: 'trial', feature: 'branches', limit_value: 1 },
        { plan: 'pro', feature: 'branches', limit_value: -1 },
      ],
      error: null,
    });

    await expect(getPublicPlanLimits()).resolves.toEqual({
      trial: { branches: 1 },
      pro: { branches: -1 },
    });
    expect(mockFrom).toHaveBeenCalledWith('plan_limits');
  });

  it('returns null on query error', async () => {
    mockSelect.mockResolvedValue({ data: null, error: { message: 'fail' } });
    await expect(getPublicPlanLimits()).resolves.toBeNull();
  });

  it('returns null when the service role key is missing', async () => {
    mockCreateAdminClient.mockImplementationOnce(() => {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
    });
    await expect(getPublicPlanLimits()).resolves.toBeNull();
  });
});
