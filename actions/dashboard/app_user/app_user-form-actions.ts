"use server";

import type { ActionState} from '@/lib/error-handler';
import { EMPTY_ACTION_STATE } from '@/lib/error-handler';
import type { AppUserInput } from '@/schemas/app_user.schema';

import { createAppUser, updateAppUser } from './actions';

export async function appUserFormAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = formData.get('id') as string;
  
  const input: AppUserInput = {
    organization_id: formData.get('organization_id') as string,
    first_name: formData.get('first_name') as string || null,
    last_name: formData.get('last_name') as string || null,
    email: formData.get('email') as string || null,
    username: formData.get('username') as string || null,
    password: formData.get('password') as string || null,
    active: formData.get('active') === 'on',
  };

  let result;
  if (id) {
    result = await updateAppUser(id, input);
  } else {
    result = await createAppUser(input);
  }

  if (result.error || !result.data) {
    if (result.error && 'fieldErrors' in result.error && result.error.fieldErrors) {
      // Convert string errors to string array format
      const fieldErrors: Record<string, string[]> = {};
      Object.entries(result.error.fieldErrors).forEach(([key, value]) => {
        fieldErrors[key] = Array.isArray(value) ? value : [value as string];
      });
      return {
        ...EMPTY_ACTION_STATE,
        fieldErrors,
      };
    }
    return {
      ...EMPTY_ACTION_STATE,
      message: 'An error occurred while saving the user.',
    };
  }

  return {
    ...EMPTY_ACTION_STATE,
    message: id ? 'User updated successfully!' : 'User created successfully!',
  };
}