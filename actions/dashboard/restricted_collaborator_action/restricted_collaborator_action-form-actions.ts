'use server';

import { revalidatePath } from 'next/cache';

import {
  createRestrictedCollaboratorAction,
  updateRestrictedCollaboratorAction,
} from '@/actions/dashboard/restricted_collaborator_action/actions';
import { fromErrorToActionState, toActionState, type ActionState } from '@/lib/error-handler';
import { RestrictedCollaboratorActionSchema } from '@/schemas/restricted_collaborator_action.schema';
import type { RestrictedCollaboratorAction } from '@/schemas/restricted_collaborator_action.schema';

export async function restrictedCollaboratorActionFormAction(_prevState: ActionState, formData: FormData) {
  try {
    const parsed = RestrictedCollaboratorActionSchema.safeParse(Object.fromEntries(formData));

    if (!parsed.success) {
      return fromErrorToActionState(parsed.error);
    }

    if (formData.get('id')) {
      await updateRestrictedCollaboratorAction(String(formData.get('id')), parsed.data as RestrictedCollaboratorAction);
    } else {
      await createRestrictedCollaboratorAction(parsed.data as RestrictedCollaboratorAction);
    }

    revalidatePath('/dashboard/restricted_collaborator_action');

    return toActionState(formData.get('id') ? 'Restricted action updated successfully!' : 'Restricted action created successfully!');
  } catch (error) {
    return fromErrorToActionState(error);
  }
}
