'use server';

import { revalidatePath } from 'next/cache';

import { createOrganizationNotificationLimit, updateOrganizationNotificationLimit } from '@/actions/dashboard/organization_notification_limits/actions';
import { fromErrorToActionState, toActionState, type ActionState } from '@/lib/error-handler';
import { OrganizationNotificationLimitSchema } from '@/schemas/organization_notification_limit.schema';
import type { OrganizationNotificationLimit } from '@/types/organization_notification_limit';

export async function organizationNotificationLimitFormAction(_prevState: ActionState, formData: FormData) {
  try {
    // Strip the useActionState prefix from field names (e.g., "1_organization_id" -> "organization_id")
    const rawFormDataObject = Object.fromEntries(formData);
    const formDataObject: Record<string, FormDataEntryValue> = {};
    
    for (const [key, value] of Object.entries(rawFormDataObject)) {
      // Skip the action state metadata field (just a number like "0")
      if (key.match(/^\d+$/)) {
        continue;
      }
      
      // Remove the numeric prefix added by useActionState (e.g., "1_organization_id" -> "organization_id")
      const cleanKey = key.match(/^\d+_/) ? key.substring(key.indexOf('_') + 1) : key;
      
      if (cleanKey) {
        formDataObject[cleanKey] = value;
      }
    }
    
    const parsedData = {
      ...formDataObject,
      daily_limit: formDataObject.daily_limit ? Number(formDataObject.daily_limit) : 1,
      monthly_limit: formDataObject.monthly_limit ? Number(formDataObject.monthly_limit) : 5,
      min_hours_between_notifications: formDataObject.min_hours_between_notifications ? Number(formDataObject.min_hours_between_notifications) : 24,
      notifications_sent_today: formDataObject.notifications_sent_today ? Number(formDataObject.notifications_sent_today) : 0,
      notifications_sent_this_month: formDataObject.notifications_sent_this_month ? Number(formDataObject.notifications_sent_this_month) : 0,
    };

    const parsed = OrganizationNotificationLimitSchema.safeParse(parsedData);

    if (!parsed.success) {
      return fromErrorToActionState(parsed.error);
    }

    let result;
    const idField = formDataObject.id;
    if (idField) {
      result = await updateOrganizationNotificationLimit(String(idField), parsed.data as OrganizationNotificationLimit);
    } else {
      result = await createOrganizationNotificationLimit(parsed.data as OrganizationNotificationLimit);
    }

    if (result.error) {
      // Handle both PostgrestError and custom validation error
      const errorMessage = 'message' in result.error 
        ? result.error.message 
        : 'fieldErrors' in result.error 
          ? Object.values(result.error.fieldErrors).join(', ')
          : 'Failed to save organization notification limit';
      throw new Error(errorMessage);
    }

    revalidatePath('/dashboard/organization_notification_limits');
    revalidatePath('/dashboard');

    return toActionState(formData.get('id') ? 'Organization notification limit updated successfully!' : 'Organization notification limit created successfully!');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return { message, fieldErrors: { _form: [message] } };
  }
}
