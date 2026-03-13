"use server";

import { revalidatePath } from 'next/cache';

import { createAppOrder, updateAppOrder } from '@/actions/dashboard/app_order/actions';
import { cleanFormData, fromErrorToActionState, toActionState, type ActionState } from '@/lib/error-handler';
import { AppOrderSchema } from '@/schemas/app_order.schema';
import type { AppOrder } from '@/types/app_order';

export async function appOrderFormAction(_prevState: ActionState, formData: FormData) {
  try {
    const formDataObject = cleanFormData(formData);
    const parsed = AppOrderSchema.safeParse(formDataObject);

    if (!parsed.success) {
      return fromErrorToActionState(parsed.error);
    }

    if (formDataObject.id) {
      await updateAppOrder(formDataObject.id as string, parsed.data as AppOrder);
    } else {
      await createAppOrder(parsed.data as AppOrder);
    }

    // Revalidate the app order list page
    revalidatePath('/dashboard/app_order');

    return toActionState(formDataObject.id ? 'App Order updated successfully!' : 'App Order created successfully!');
  } catch (error) {
    return fromErrorToActionState(error);
  }
}