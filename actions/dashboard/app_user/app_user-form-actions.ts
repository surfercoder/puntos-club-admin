"use server";

import { revalidatePath } from 'next/cache';

import { createAppUser, updateAppUser } from '@/actions/dashboard/app_user/actions';
import { fromErrorToActionState, toActionState, type ActionState } from '@/lib/error-handler';
import { AppUserSchema } from '@/schemas/app_user.schema';
import type { AppUser } from '@/types/app_user';

export async function appUserFormAction(_prevState: ActionState, formData: FormData) {
  try {
    const parsed = AppUserSchema.safeParse(Object.fromEntries(formData));

    if (!parsed.success) {
      return fromErrorToActionState(parsed.error);
    }

    if (formData.get('id')) {
      await updateAppUser(formData.get('id') as string, parsed.data as AppUser);
    } else {
      await createAppUser(parsed.data as AppUser);
    }

    // Revalidate the app user list page
    revalidatePath('/dashboard/app_user');

    return toActionState(formData.get('id') ? 'App User updated successfully!' : 'App User created successfully!');
  } catch (error) {
    return fromErrorToActionState(error);
  }
}