'use server';

import { revalidatePath } from 'next/cache';

import { createUser, updateUser } from '@/actions/dashboard/user/actions';
import { fromErrorToActionState, toActionState, type ActionState } from '@/lib/error-handler';
import { UserSchema } from '@/schemas/user.schema';
import type { User } from '@/types/user';

export async function userFormAction(_prevState: ActionState, formData: FormData) {
  try {
    const formDataObject = Object.fromEntries(formData);
    const parsed = UserSchema.safeParse(formDataObject);

    if (!parsed.success) {
      return fromErrorToActionState(parsed.error);
    }

    if (formData.get('id')) {
      await updateUser(String(formData.get('id')), parsed.data as User);
    } else {
      await createUser(parsed.data as User);
    }

    // Revalidate the user list page
    revalidatePath('/dashboard/users');

    return toActionState(formData.get('id') ? 'User updated successfully!' : 'User created successfully!');
  } catch (error) {
    return fromErrorToActionState(error);
  }
}
