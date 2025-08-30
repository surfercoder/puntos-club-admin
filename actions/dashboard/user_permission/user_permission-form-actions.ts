"use server";

import type { ActionState} from '@/lib/error-handler';
import { EMPTY_ACTION_STATE } from '@/lib/error-handler';
import type { UserPermissionInput } from '@/schemas/user_permission.schema';

import { createUserPermission, updateUserPermission } from './actions';

export async function userPermissionFormAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = formData.get('id') as string;
  
  const input: UserPermissionInput = {
    user_id: formData.get('user_id') as string,
    branch_id: formData.get('branch_id') as string,
    action: formData.get('action') as string,
    assignment_date: formData.get('assignment_date') as string,
  };

  let result;
  if (id) {
    result = await updateUserPermission(id, input);
  } else {
    result = await createUserPermission(input);
  }

  if (result.error) {
    if ('fieldErrors' in result.error) {
      // Convert string errors to string array format
      const fieldErrors: Record<string, string[]> = {};
      Object.entries(result.error.fieldErrors).forEach(([key, value]) => {
        fieldErrors[key] = [value];
      });
      return {
        ...EMPTY_ACTION_STATE,
        fieldErrors,
      };
    }
    return {
      ...EMPTY_ACTION_STATE,
      message: 'An error occurred while saving the user permission.',
    };
  }

  return {
    ...EMPTY_ACTION_STATE,
    message: id ? 'User permission updated successfully!' : 'User permission created successfully!',
  };
}