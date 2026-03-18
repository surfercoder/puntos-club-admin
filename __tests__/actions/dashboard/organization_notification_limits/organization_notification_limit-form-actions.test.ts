jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn(() => ({ value: '123' })), set: jest.fn() })),
}));

jest.mock('@/actions/dashboard/organization_notification_limits/actions', () => ({
  createOrganizationNotificationLimit: jest.fn(() => ({ data: { id: '1' }, error: null })),
  updateOrganizationNotificationLimit: jest.fn(() => ({ data: { id: '1' }, error: null })),
}));

import { revalidatePath } from 'next/cache';
import { organizationNotificationLimitFormAction } from '@/actions/dashboard/organization_notification_limits/organization_notification_limit-form-actions';
import {
  createOrganizationNotificationLimit,
  updateOrganizationNotificationLimit,
} from '@/actions/dashboard/organization_notification_limits/actions';
import { EMPTY_ACTION_STATE } from '@/lib/error-handler';

beforeEach(() => {
  jest.clearAllMocks();
  (createOrganizationNotificationLimit as jest.Mock).mockReturnValue({ data: { id: '1' }, error: null });
  (updateOrganizationNotificationLimit as jest.Mock).mockReturnValue({ data: { id: '1' }, error: null });
});

function createFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) fd.append(k, v);
  return fd;
}

const validFields = {
  organization_id: '10',
  plan_type: 'free',
  daily_limit: '5',
  monthly_limit: '20',
  min_hours_between_notifications: '12',
};

describe('organizationNotificationLimitFormAction', () => {
  it('should create successfully', async () => {
    const fd = createFormData(validFields);
    const result = await organizationNotificationLimitFormAction(EMPTY_ACTION_STATE, fd);
    expect(createOrganizationNotificationLimit).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/organization_notification_limits');
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
    expect(result.status).toBe('success');
  });

  it('should update successfully', async () => {
    const fd = createFormData({ ...validFields, id: '1' });
    const result = await organizationNotificationLimitFormAction(EMPTY_ACTION_STATE, fd);
    expect(updateOrganizationNotificationLimit).toHaveBeenCalled();
    expect(result.status).toBe('success');
  });

  it('should return validation error', async () => {
    const fd = createFormData({ organization_id: '' });
    const result = await organizationNotificationLimitFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });

  it('should handle API error result with message', async () => {
    (createOrganizationNotificationLimit as jest.Mock).mockReturnValue({
      data: null,
      error: { message: 'DB error' },
    });
    const fd = createFormData(validFields);
    const result = await organizationNotificationLimitFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
    expect(result.message).toBe('DB error');
  });

  it('should handle API error result with fieldErrors', async () => {
    (createOrganizationNotificationLimit as jest.Mock).mockReturnValue({
      data: null,
      error: { fieldErrors: { organization_id: 'Required' } },
    });
    const fd = createFormData(validFields);
    const result = await organizationNotificationLimitFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });

  it('should handle API error without message or fieldErrors', async () => {
    (createOrganizationNotificationLimit as jest.Mock).mockReturnValue({
      data: null,
      error: {},
    });
    const fd = createFormData(validFields);
    const result = await organizationNotificationLimitFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
    expect(result.message).toBe('Failed to save organization notification limit');
  });

  it('should use default number values when fields are empty', async () => {
    const fd = createFormData({ organization_id: '10', plan_type: 'free' });
    const result = await organizationNotificationLimitFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('success');
  });

  it('should parse number fields correctly when provided', async () => {
    const fd = createFormData({
      organization_id: '10',
      plan_type: 'free',
      daily_limit: '3',
      monthly_limit: '15',
      min_hours_between_notifications: '6',
      notifications_sent_today: '2',
      notifications_sent_this_month: '8',
    });
    const result = await organizationNotificationLimitFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('success');
  });
});
