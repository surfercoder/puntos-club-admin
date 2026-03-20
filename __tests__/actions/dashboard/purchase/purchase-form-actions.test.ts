jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn(() => ({ value: '123' })), set: jest.fn() })),
}));

const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  single: jest.fn(() => ({ error: null })),
};
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => mockSupabase) }));

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { purchaseFormAction } from '@/actions/dashboard/purchase/purchase-form-actions';
import { EMPTY_ACTION_STATE } from '@/lib/error-handler';

beforeEach(() => {
  jest.clearAllMocks();
  mockSupabase.from.mockReturnValue(mockSupabase);
  mockSupabase.insert.mockReturnValue(mockSupabase);
  mockSupabase.update.mockReturnValue(mockSupabase);
  mockSupabase.select.mockReturnValue(mockSupabase);
  mockSupabase.eq.mockReturnValue(mockSupabase);
  mockSupabase.single.mockReturnValue({ error: null });
});

function createFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) fd.append(k, v);
  return fd;
}

describe('purchaseFormAction', () => {
  it('should create purchase and redirect', async () => {
    const fd = createFormData({ beneficiary_id: 'ben-1', cashier_id: 'cash-1', total_amount: '100.50' });
    await purchaseFormAction(EMPTY_ACTION_STATE, fd);
    expect(mockSupabase.from).toHaveBeenCalledWith('purchase');
    expect(mockSupabase.insert).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/purchase');
    expect(redirect).toHaveBeenCalled();
  });

  it('should update purchase and redirect', async () => {
    const fd = createFormData({ id: '1', beneficiary_id: 'ben-1', cashier_id: 'cash-1', total_amount: '100.50' });
    await purchaseFormAction(EMPTY_ACTION_STATE, fd);
    expect(mockSupabase.from).toHaveBeenCalledWith('purchase');
    expect(mockSupabase.update).toHaveBeenCalled();
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1');
    expect(redirect).toHaveBeenCalled();
  });

  it('should return validation error for invalid data', async () => {
    const fd = createFormData({ beneficiary_id: '', cashier_id: 'cash-1', total_amount: '100.50' });
    const result = await purchaseFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });

  it('should return error from supabase', async () => {
    mockSupabase.single.mockReturnValue({ error: new Error('Supabase error') });
    const fd = createFormData({ beneficiary_id: 'ben-1', cashier_id: 'cash-1', total_amount: '100.50' });
    const result = await purchaseFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });

  it('should handle unexpected thrown error', async () => {
    mockSupabase.from.mockImplementation(() => { throw new Error('Unexpected'); });
    const fd = createFormData({ beneficiary_id: 'ben-1', cashier_id: 'cash-1', total_amount: '100.50' });
    await expect(purchaseFormAction(EMPTY_ACTION_STATE, fd)).rejects.toThrow('Unexpected');
  });
});
