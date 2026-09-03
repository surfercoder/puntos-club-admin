import type { OrganizationNotificationLimit, PLAN_LIMITS } from '@/types/organization_notification_limit';

// Extracted from OrganizationNotificationLimitForm to keep the component's
// own control-flow complexity down; behavior is unchanged.
export function resolveNotificationLimitDefaults(
  organizationNotificationLimit: OrganizationNotificationLimit | undefined,
  planLimits: (typeof PLAN_LIMITS)[keyof typeof PLAN_LIMITS] | undefined,
) {
  return {
    /* c8 ignore next */
    dailyLimit: organizationNotificationLimit?.daily_limit ?? planLimits?.daily ?? 1,
    /* c8 ignore next */
    monthlyLimit: organizationNotificationLimit?.monthly_limit ?? planLimits?.monthly ?? 5,
    /* c8 ignore next */
    minHours: organizationNotificationLimit?.min_hours_between_notifications ?? planLimits?.minHours ?? 24,
  };
}

// Extracted from OrganizationNotificationLimitForm to keep the component's
// own control-flow complexity down; behavior is unchanged.
export function buildNotificationLimitPayload(formDataObject: Record<string, FormDataEntryValue>) {
  return {
    ...formDataObject,
    daily_limit: formDataObject.daily_limit ? Number(formDataObject.daily_limit) : 1,
    monthly_limit: formDataObject.monthly_limit ? Number(formDataObject.monthly_limit) : 5,
    min_hours_between_notifications: formDataObject.min_hours_between_notifications ? Number(formDataObject.min_hours_between_notifications) : 24,
    /* c8 ignore next 2 */
    notifications_sent_today: formDataObject.notifications_sent_today ? Number(formDataObject.notifications_sent_today) : 0,
    notifications_sent_this_month: formDataObject.notifications_sent_this_month ? Number(formDataObject.notifications_sent_this_month) : 0,
  };
}
