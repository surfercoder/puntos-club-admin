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
  single: jest.fn(() => ({ data: null, error: null })),
  rpc: jest.fn(() => ({ data: null, error: null })),
  auth: { getUser: jest.fn(() => ({ data: { user: { id: 'auth-1' } }, error: null })) },
};
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => mockSupabase) }));

import { completeTour } from '@/actions/dashboard/tour/actions';

beforeEach(() => {
  jest.clearAllMocks();
  mockSupabase.from.mockReturnValue(mockSupabase);
  mockSupabase.update.mockReturnValue(mockSupabase);
  mockSupabase.eq.mockReturnValue({ error: null });
});

describe('completeTour', () => {
  it('should update tour_completed for user', async () => {
    const result = await completeTour('1');
    expect(mockSupabase.from).toHaveBeenCalledWith('app_user');
    expect(mockSupabase.update).toHaveBeenCalledWith({ tour_completed: true });
    expect(result.error).toBeNull();
  });

  it('should return error on failure', async () => {
    mockSupabase.eq.mockReturnValue({ error: { message: 'Error' } });
    const result = await completeTour('1');
    expect(result.error).toEqual({ message: 'Error' });
  });
});
