'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createSubscription, updateSubscription } from '@/actions/dashboard/subscription/actions';
import { actionMessage, cleanFormData, fromErrorToActionState, type ActionState } from '@/lib/error-handler';
import { SubscriptionSchema } from '@/schemas/subscription.schema';
import type { Subscription } from '@/types/subscription';

export async function subscriptionFormAction(_prevState: ActionState, formData: FormData) {
  const formDataObject = cleanFormData(formData);
  const parsed = SubscriptionSchema.safeParse(formDataObject);

  if (!parsed.success) {
    return await fromErrorToActionState(parsed.error);
  }

  const isUpdate = !!formDataObject.id;
  const result = isUpdate
    ? await updateSubscription(String(formDataObject.id), parsed.data as Subscription)
    : await createSubscription(parsed.data as Subscription);

  if (result.error) {
    return await fromErrorToActionState(result.error);
  }

  revalidatePath('/dashboard/subscription');
  const message = await actionMessage(isUpdate ? 'subscriptionUpdated' : 'subscriptionCreated');
  redirect(`/dashboard/subscription?success=${encodeURIComponent(message)}`);
}
