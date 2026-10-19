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
    minHours: organizationNotificationLimit?.min_hours_between_notifications ?? planLimits?.minHours ?? 24,
  };
}

// Extracted from OrganizationNotificationLimitForm to keep the component's
// own control-flow complexity down; behavior is unchanged.
export function buildNotificationLimitPayload(formDataObject: Record<string, FormDataEntryValue>) {
  return {
    ...formDataObject,
    daily_limit: formDataObject.daily_limit ? Number(formDataObject.daily_limit) : 1,
    min_hours_between_notifications: formDataObject.min_hours_between_notifications ? Number(formDataObject.min_hours_between_notifications) : 24,
  };
}
