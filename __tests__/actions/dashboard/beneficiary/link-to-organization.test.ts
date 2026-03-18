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
  range: jest.fn(() => mockSupabase),
  single: jest.fn(() => ({ data: { id: '1', first_name: 'John' }, error: null })),
  rpc: jest.fn(() => ({ data: null, error: null })),
  auth: { getUser: jest.fn(() => ({ data: { user: { id: 'auth-1' } }, error: null })) },
};
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => mockSupabase) }));
jest.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: jest.fn(() => ({ id: 1, organization_id: 10 })),
}));
jest.mock('@/lib/plans/usage', () => ({
  enforcePlanLimit: jest.fn(() => null),
}));

import {
  linkBeneficiaryToOrganization,
  linkAllUnlinkedBeneficiaries,
} from '@/actions/dashboard/beneficiary/link-to-organization';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { enforcePlanLimit } from '@/lib/plans/usage';

beforeEach(() => {
  jest.clearAllMocks();
  // Reset mocks to clear any leftover mockReturnValueOnce queues
  mockSupabase.from.mockReset().mockReturnValue(mockSupabase);
  mockSupabase.select.mockReset().mockReturnValue(mockSupabase);
  mockSupabase.insert.mockReset().mockReturnValue(mockSupabase);
  mockSupabase.update.mockReset().mockReturnValue(mockSupabase);
  mockSupabase.delete.mockReset().mockReturnValue(mockSupabase);
  mockSupabase.eq.mockReset().mockReturnValue(mockSupabase);
  mockSupabase.range.mockReset().mockReturnValue(mockSupabase);
  mockSupabase.single.mockReset().mockReturnValue({ data: { id: '1', first_name: 'John' }, error: null });
  (getCurrentUser as jest.Mock).mockReturnValue({ id: 1, organization_id: 10 });
  (enforcePlanLimit as jest.Mock).mockReturnValue(null);
});

describe('linkBeneficiaryToOrganization', () => {
  it('should return error when no organization', async () => {
    (getCurrentUser as jest.Mock).mockReturnValue({ id: 1, organization_id: null });
    const result = await linkBeneficiaryToOrganization('1');
    expect(result).toEqual({ data: null, error: { message: 'No organization found for current user' } });
  });

  it('should return error when beneficiary not found', async () => {
    mockSupabase.single
      .mockReturnValueOnce({ data: null, error: { message: 'Not found' } });
    const result = await linkBeneficiaryToOrganization('999');
    expect(result).toEqual({ data: null, error: { message: 'Beneficiary not found' } });
  });

  it('should return existing relationship when already active', async () => {
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: '1', first_name: 'John' }, error: null }) // beneficiary
      .mockReturnValueOnce({ data: { id: 5, is_active: true }, error: null }); // existing relationship
    const result = await linkBeneficiaryToOrganization('1');
    expect(result).toEqual({ data: { id: 5, is_active: true }, error: null });
  });

  it('should reactivate inactive relationship', async () => {
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: '1' }, error: null }) // beneficiary
      .mockReturnValueOnce({ data: { id: 5, is_active: false }, error: null }) // existing inactive
      .mockReturnValueOnce({ data: { id: 5, is_active: true }, error: null }); // after update
    const result = await linkBeneficiaryToOrganization('1');
    expect(mockSupabase.update).toHaveBeenCalledWith({ is_active: true });
    expect(result.data).toBeDefined();
  });

  it('should return plan limit error when reactivating', async () => {
    (enforcePlanLimit as jest.Mock).mockReturnValue({ message: 'Limit reached' });
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: '1' }, error: null })
      .mockReturnValueOnce({ data: { id: 5, is_active: false }, error: null });
    const result = await linkBeneficiaryToOrganization('1');
    expect(result).toEqual({ data: null, error: { message: 'Limit reached' } });
  });

  it('should create new relationship', async () => {
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: '1' }, error: null }) // beneficiary
      .mockReturnValueOnce({ data: null, error: { message: 'Not found' } }) // no existing
      .mockReturnValueOnce({ data: { id: 10, is_active: true }, error: null }); // new relationship
    const result = await linkBeneficiaryToOrganization('1');
    expect(mockSupabase.insert).toHaveBeenCalled();
    expect(result.data).toBeDefined();
    expect(result.error).toBeNull();
  });

  it('should return plan limit error when creating new', async () => {
    (enforcePlanLimit as jest.Mock).mockReturnValue({ message: 'Limit' });
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: '1' }, error: null })
      .mockReturnValueOnce({ data: null, error: { message: 'Not found' } });
    const result = await linkBeneficiaryToOrganization('1');
    expect(result).toEqual({ data: null, error: { message: 'Limit' } });
  });

  it('should normalize supabase error on insert', async () => {
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: '1' }, error: null })
      .mockReturnValueOnce({ data: null, error: { message: 'Not found' } })
      .mockReturnValueOnce({ data: null, error: { message: 'Insert error', code: '23505', details: 'dup', hint: '' } });
    const result = await linkBeneficiaryToOrganization('1');
    expect(result.error).toEqual({
      message: 'Insert error',
      code: '23505',
      details: 'dup',
      hint: '',
    });
  });
});

describe('linkAllUnlinkedBeneficiaries', () => {
  it('should return error when no organization', async () => {
    (getCurrentUser as jest.Mock).mockReturnValue({ id: 1, organization_id: null });
    const result = await linkAllUnlinkedBeneficiaries();
    expect(result).toEqual({ data: null, error: { message: 'No organization found for current user' } });
  });

  it('should return message when all already linked', async () => {
    // relationships batch: 1 beneficiary linked, length < BATCH_SIZE so loop exits
    mockSupabase.range.mockReturnValueOnce({
      data: [{ beneficiary_id: 1 }],
      error: null,
    });
    // beneficiaries batch: 1 beneficiary (same as linked), length < BATCH_SIZE so loop exits
    mockSupabase.range.mockReturnValueOnce({ data: [{ id: 1 }], error: null });

    const result = await linkAllUnlinkedBeneficiaries();
    expect(result.data).toEqual({ linked: 0, message: 'All beneficiaries are already linked' });
  });

  it('should link unlinked beneficiaries', async () => {
    mockSupabase.range
      .mockReturnValueOnce({ data: [], error: null }) // no existing relationships
      .mockReturnValueOnce({ data: [{ id: 1 }, { id: 2 }], error: null }) // beneficiaries
      .mockReturnValueOnce({ data: [], error: null }); // second batch empty
    // select is used for chaining twice, then terminal on insert
    mockSupabase.select
      .mockReturnValueOnce(mockSupabase) // .select('beneficiary_id') in relationships loop
      .mockReturnValueOnce(mockSupabase) // .select('id') in beneficiaries loop
      .mockReturnValueOnce({ data: [{ id: 10 }, { id: 11 }], error: null }); // .insert().select()

    const result = await linkAllUnlinkedBeneficiaries();
    expect(result.data).toEqual({ linked: 2, message: 'Successfully linked 2 beneficiaries' });
  });

  it('should return error on relationships fetch failure', async () => {
    mockSupabase.range.mockReturnValue({ data: null, error: { message: 'DB error' } });
    const result = await linkAllUnlinkedBeneficiaries();
    expect(result.error).toEqual({ message: expect.stringContaining('Error fetching relationships') });
  });

  it('should return error on beneficiaries fetch failure', async () => {
    mockSupabase.range
      .mockReturnValueOnce({ data: [], error: null })
      .mockReturnValueOnce({ data: null, error: { message: 'DB error' } });
    const result = await linkAllUnlinkedBeneficiaries();
    expect(result.error).toEqual({ message: expect.stringContaining('Error fetching beneficiaries') });
  });

  it('should normalize supabase error on bulk insert', async () => {
    mockSupabase.range
      .mockReturnValueOnce({ data: [], error: null })
      .mockReturnValueOnce({ data: [{ id: 1 }], error: null });
    // select is used for chaining twice, then terminal on insert
    mockSupabase.select
      .mockReturnValueOnce(mockSupabase) // .select('beneficiary_id') in relationships loop
      .mockReturnValueOnce(mockSupabase) // .select('id') in beneficiaries loop
      .mockReturnValueOnce({ data: null, error: { message: 'Bulk error', code: '500', details: '', hint: '' } }); // .insert().select()
    const result = await linkAllUnlinkedBeneficiaries();
    expect(result.error).toEqual({ message: 'Bulk error', code: '500', details: '', hint: '' });
  });

  it('should handle empty beneficiaries batch (line 178)', async () => {
    // Line 178: beneficiariesBatch is empty, so hasMoreBeneficiaries = false
    mockSupabase.range
      .mockReturnValueOnce({ data: [], error: null }) // relationships: empty
      .mockReturnValueOnce({ data: [], error: null }); // beneficiaries: empty
    const result = await linkAllUnlinkedBeneficiaries();
    expect(result.data).toEqual({ linked: 0, message: 'All beneficiaries are already linked' });
  });

  it('should handle null beneficiaries batch', async () => {
    // Line 178: beneficiariesBatch is null
    mockSupabase.range
      .mockReturnValueOnce({ data: [], error: null }) // relationships: empty
      .mockReturnValueOnce({ data: null, error: null }); // beneficiaries: null (no error)
    const result = await linkAllUnlinkedBeneficiaries();
    expect(result.data).toEqual({ linked: 0, message: 'All beneficiaries are already linked' });
  });

  it('should return linked 0 when insert returns null data', async () => {
    // Lines 224-225: data?.length || 0 where data is null
    mockSupabase.range
      .mockReturnValueOnce({ data: [], error: null }) // no existing relationships
      .mockReturnValueOnce({ data: [{ id: 1 }], error: null }); // 1 unlinked beneficiary
    mockSupabase.select
      .mockReturnValueOnce(mockSupabase) // .select('beneficiary_id')
      .mockReturnValueOnce(mockSupabase) // .select('id')
      .mockReturnValueOnce({ data: null, error: null }); // .insert().select() returns null data
    const result = await linkAllUnlinkedBeneficiaries();
    expect(result.data).toEqual({ linked: 0, message: 'Successfully linked 0 beneficiaries' });
    expect(result.error).toBeNull();
  });
});
