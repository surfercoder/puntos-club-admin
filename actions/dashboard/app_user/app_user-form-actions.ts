"use server";

import { revalidatePath } from 'next/cache';

import { createAppUser, updateAppUser } from '@/actions/dashboard/app_user/actions';
import { cleanFormData, fromErrorToActionState, toActionState, type ActionState } from '@/lib/error-handler';
import { AppUserSchema } from '@/schemas/app_user.schema';
import type { AppUser } from '@/types/app_user';

export async function appUserFormAction(_prevState: ActionState, formData: FormData) {
  try {
    const formDataObject = cleanFormData(formData);
    const parsed = AppUserSchema.safeParse(formDataObject);

    if (!parsed.success) {
      return fromErrorToActionState(parsed.error);
    }

    if (formDataObject.id) {
      await updateAppUser(formDataObject.id as string, parsed.data as AppUser);
    } else {
      await createAppUser(parsed.data as AppUser);
    }

    // Revalidate the app user list page
    revalidatePath('/dashboard/app_user');

    return toActionState(formDataObject.id ? 'App User updated successfully!' : 'App User created successfully!');
  } catch (error) {
    return fromErrorToActionState(error);
  }
}