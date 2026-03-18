'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createPushToken, updatePushToken } from '@/actions/dashboard/push_tokens/actions';
import { cleanFormData, fromErrorToActionState, type ActionState } from '@/lib/error-handler';
import { PushTokenSchema } from '@/schemas/push_token.schema';
import type { PushToken } from '@/types/push_token';

export async function pushTokenFormAction(_prevState: ActionState, formData: FormData) {
  const formDataObject = cleanFormData(formData);
  const parsed = PushTokenSchema.safeParse(formDataObject);

  if (!parsed.success) {
    return fromErrorToActionState(parsed.error);
  }

  const isUpdate = !!formDataObject.id;
  const result = isUpdate
    ? await updatePushToken(String(formDataObject.id), parsed.data as PushToken)
    : await createPushToken(parsed.data as PushToken);

  if (result.error) {
    return fromErrorToActionState(result.error);
  }

  revalidatePath('/dashboard/push_tokens');
  const message = isUpdate ? 'Push token updated successfully!' : 'Push token created successfully!';
  redirect(`/dashboard/push_tokens?success=${encodeURIComponent(message)}`);
}
