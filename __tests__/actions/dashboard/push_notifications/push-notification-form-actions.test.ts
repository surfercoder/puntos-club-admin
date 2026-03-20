jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn(() => ({ value: '123' })), set: jest.fn() })),
}));

jest.mock('@/actions/dashboard/push_notifications/actions', () => ({
  updatePushNotification: jest.fn(() => ({ data: { id: '1' }, error: null })),
}));

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { pushNotificationFormAction } from '@/actions/dashboard/push_notifications/push-notification-form-actions';
import { updatePushNotification } from '@/actions/dashboard/push_notifications/actions';
import { EMPTY_ACTION_STATE } from '@/lib/error-handler';

beforeEach(() => {
  jest.clearAllMocks();
  (updatePushNotification as jest.Mock).mockReturnValue({ data: { id: '1' }, error: null });
});

function createFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) fd.append(k, v);
  return fd;
}

describe('pushNotificationFormAction', () => {
  it('should update push notification and redirect', async () => {
    const fd = createFormData({ id: '1', organization_id: 'org-1', created_by: 'user-1', title: 'Test', body: 'Body', status: 'draft' });
    await pushNotificationFormAction(EMPTY_ACTION_STATE, fd);
    expect(updatePushNotification).toHaveBeenCalledWith('1', expect.any(Object));
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/push_notifications');
    expect(redirect).toHaveBeenCalled();
  });

  it('should return error when no id is provided', async () => {
    const fd = createFormData({ organization_id: 'org-1', created_by: 'user-1', title: 'Test', body: 'Body', status: 'draft' });
    const result = await pushNotificationFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });

  it('should return validation error for invalid data', async () => {
    const fd = createFormData({ id: '1', organization_id: '', created_by: 'user-1', title: 'Test', body: 'Body' });
    const result = await pushNotificationFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });

  it('should return error from API', async () => {
    (updatePushNotification as jest.Mock).mockReturnValue({ error: new Error('API error') });
    const fd = createFormData({ id: '1', organization_id: 'org-1', created_by: 'user-1', title: 'Test', body: 'Body', status: 'draft' });
    const result = await pushNotificationFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });

  it('should handle unexpected thrown error', async () => {
    (updatePushNotification as jest.Mock).mockImplementation(() => { throw new Error('Unexpected'); });
    const fd = createFormData({ id: '1', organization_id: 'org-1', created_by: 'user-1', title: 'Test', body: 'Body', status: 'draft' });
    await expect(pushNotificationFormAction(EMPTY_ACTION_STATE, fd)).rejects.toThrow('Unexpected');
  });
});
