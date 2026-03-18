'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { updatePushNotification } from '@/actions/dashboard/push_notifications/actions';
import { cleanFormData, fromErrorToActionState, type ActionState } from '@/lib/error-handler';
import { PushNotificationSchema } from '@/schemas/push_notification.schema';
import type { PushNotification } from '@/types/push_notification';

export async function pushNotificationFormAction(_prevState: ActionState, formData: FormData) {
  const formDataObject = cleanFormData(formData);
  const parsed = PushNotificationSchema.safeParse(formDataObject);

  if (!parsed.success) {
    return fromErrorToActionState(parsed.error);
  }

  const isUpdate = !!formDataObject.id;
  if (!isUpdate) {
    return fromErrorToActionState(new Error('Use the dedicated create page for new notifications'));
  }

  const result = await updatePushNotification(String(formDataObject.id), parsed.data as PushNotification);

  if (result.error) {
    return fromErrorToActionState(result.error);
  }

  revalidatePath('/dashboard/push_notifications');
  redirect(`/dashboard/push_notifications?success=${encodeURIComponent('Push notification updated successfully!')}`);
}
