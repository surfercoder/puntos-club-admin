"use server";

import { revalidatePath } from 'next/cache';

import { createAppUser, updateAppUser } from '@/actions/dashboard/app_user/actions';
import { cleanFormData, fromErrorToActionState, toActionState, type ActionState } from '@/lib/error-handler';
import { AppUserSchema } from '@/schemas/app_user.schema';

export async function appUserFormAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const formDataObject = cleanFormData(formData);
    const parsed = AppUserSchema.safeParse(formDataObject);

    if (!parsed.success) {
      return fromErrorToActionState(parsed.error);
    }

    const result = formDataObject.id
      ? await updateAppUser(formDataObject.id as string, parsed.data)
      : await createAppUser(parsed.data);

    if (result.error) {
      const message = 'message' in result.error
        ? (result.error.message ?? 'An unexpected error occurred')
        : 'An unexpected error occurred';
      return { status: 'error' as const, message, fieldErrors: {} };
    }

    // Revalidate the app user list page
    revalidatePath('/dashboard/app_user');

    return toActionState(formDataObject.id ? 'App User updated successfully!' : 'App User created successfully!');
  } catch (error) {
    return fromErrorToActionState(error);
  }
}