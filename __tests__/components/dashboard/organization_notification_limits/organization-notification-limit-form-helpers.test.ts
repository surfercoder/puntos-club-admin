import {
  buildNotificationLimitPayload,
  resolveNotificationLimitDefaults,
} from '@/components/dashboard/organization_notification_limits/organization-notification-limit-form-helpers';
import { PLAN_LIMITS } from '@/types/organization_notification_limit';

describe('buildNotificationLimitPayload', () => {
  it('converts the numeric fields and keeps the rest', () => {
    expect(
      buildNotificationLimitPayload({ organization_id: '3', daily_limit: '4', min_hours_between_notifications: '6' }),
    ).toEqual({ organization_id: '3', daily_limit: 4, min_hours_between_notifications: 6 });
  });

  it('falls back to 1 per day and 24h between sends when the fields are empty', () => {
    expect(buildNotificationLimitPayload({ daily_limit: '', min_hours_between_notifications: '' })).toEqual({
      daily_limit: 1,
      min_hours_between_notifications: 24,
    });
  });
});

describe('resolveNotificationLimitDefaults', () => {
  it('uses the plan limits when there is no saved row', () => {
    expect(resolveNotificationLimitDefaults(undefined, PLAN_LIMITS.pro)).toEqual({ dailyLimit: 3, minHours: 8 });
  });
});
