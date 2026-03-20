jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn(() => ({ value: '123' })), set: jest.fn() })),
}));

jest.mock('@/actions/dashboard/push_tokens/actions', () => ({
  createPushToken: jest.fn(() => ({ data: { id: '1' }, error: null })),
  updatePushToken: jest.fn(() => ({ data: { id: '1' }, error: null })),
}));

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { pushTokenFormAction } from '@/actions/dashboard/push_tokens/push-token-form-actions';
import { createPushToken, updatePushToken } from '@/actions/dashboard/push_tokens/actions';
import { EMPTY_ACTION_STATE } from '@/lib/error-handler';

beforeEach(() => {
  jest.clearAllMocks();
  (createPushToken as jest.Mock).mockReturnValue({ data: { id: '1' }, error: null });
  (updatePushToken as jest.Mock).mockReturnValue({ data: { id: '1' }, error: null });
});

function createFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) fd.append(k, v);
  return fd;
}

describe('pushTokenFormAction', () => {
  it('should create push token and redirect', async () => {
    const fd = createFormData({ beneficiary_id: 'ben-1', expo_push_token: 'ExponentPushToken[abc123]' });
    await pushTokenFormAction(EMPTY_ACTION_STATE, fd);
    expect(createPushToken).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/push_tokens');
    expect(redirect).toHaveBeenCalled();
  });

  it('should update push token and redirect', async () => {
    const fd = createFormData({ id: '1', beneficiary_id: 'ben-1', expo_push_token: 'ExponentPushToken[abc123]' });
    await pushTokenFormAction(EMPTY_ACTION_STATE, fd);
    expect(updatePushToken).toHaveBeenCalledWith('1', expect.any(Object));
    expect(redirect).toHaveBeenCalled();
  });

  it('should return validation error for invalid data', async () => {
    const fd = createFormData({ beneficiary_id: '', expo_push_token: 'ExponentPushToken[abc123]' });
    const result = await pushTokenFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });

  it('should return error from API', async () => {
    (createPushToken as jest.Mock).mockReturnValue({ error: new Error('API error') });
    const fd = createFormData({ beneficiary_id: 'ben-1', expo_push_token: 'ExponentPushToken[abc123]' });
    const result = await pushTokenFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });

  it('should handle unexpected thrown error', async () => {
    (createPushToken as jest.Mock).mockImplementation(() => { throw new Error('Unexpected'); });
    const fd = createFormData({ beneficiary_id: 'ben-1', expo_push_token: 'ExponentPushToken[abc123]' });
    await expect(pushTokenFormAction(EMPTY_ACTION_STATE, fd)).rejects.toThrow('Unexpected');
  });
});
