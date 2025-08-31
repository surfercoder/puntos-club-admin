'use server';

import { revalidatePath } from 'next/cache';

import { createUserPermission, updateUserPermission } from '@/actions/dashboard/user_permission/actions';
import { fromErrorToActionState, toActionState, type ActionState } from '@/lib/error-handler';
import { UserPermissionSchema } from '@/schemas/user_permission.schema';
import type { UserPermission } from '@/types/user_permission';

export async function userPermissionFormAction(_prevState: ActionState, formData: FormData) {
  try {
    const parsed = UserPermissionSchema.safeParse(Object.fromEntries(formData));

    if (!parsed.success) {
      return fromErrorToActionState(parsed.error);
    }

    if (formData.get('id')) {
      await updateUserPermission(String(formData.get('id')), parsed.data as UserPermission);
    } else {
      await createUserPermission(parsed.data as UserPermission);
    }

    // Revalidate the user permission list page
    revalidatePath('/dashboard/user_permission');

    return toActionState(formData.get('id') ? 'User permission updated successfully!' : 'User permission created successfully!');
  } catch (error) {
    return fromErrorToActionState(error);
  }
}