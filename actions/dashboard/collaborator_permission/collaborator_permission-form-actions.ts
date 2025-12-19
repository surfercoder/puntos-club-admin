'use server';

import { revalidatePath } from 'next/cache';

import {
  createCollaboratorPermission,
  updateCollaboratorPermission,
} from '@/actions/dashboard/collaborator_permission/actions';
import { fromErrorToActionState, toActionState, type ActionState } from '@/lib/error-handler';
import { CollaboratorPermissionSchema } from '@/schemas/collaborator_permission.schema';
import type { CollaboratorPermission } from '@/schemas/collaborator_permission.schema';

export async function collaboratorPermissionFormAction(_prevState: ActionState, formData: FormData) {
  try {
    const parsed = CollaboratorPermissionSchema.safeParse(Object.fromEntries(formData));

    if (!parsed.success) {
      return fromErrorToActionState(parsed.error);
    }

    if (formData.get('id')) {
      await updateCollaboratorPermission(String(formData.get('id')), parsed.data as CollaboratorPermission);
    } else {
      await createCollaboratorPermission(parsed.data as CollaboratorPermission);
    }

    revalidatePath('/dashboard/collaborator_permission');

    return toActionState(formData.get('id') ? 'Collaborator permission updated successfully!' : 'Collaborator permission created successfully!');
  } catch (error) {
    return fromErrorToActionState(error);
  }
}
