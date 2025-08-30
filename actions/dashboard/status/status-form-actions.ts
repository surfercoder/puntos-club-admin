"use server";

import type { ActionState} from '@/lib/error-handler';
import { EMPTY_ACTION_STATE } from '@/lib/error-handler';
import type { StatusInput } from '@/schemas/status.schema';

import { createStatus, updateStatus } from './actions';

export async function statusFormAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = formData.get('id') as string;
  
  const input: StatusInput = {
    name: formData.get('name') as string,
    description: formData.get('description') as string || null,
    is_terminal: formData.get('is_terminal') === 'on',
    order_num: parseInt(formData.get('order_num') as string) || 0,
  };

  let result;
  if (id) {
    result = await updateStatus(id, input);
  } else {
    result = await createStatus(input);
  }

  if (result.error || !result.data) {
    if (result.error && 'fieldErrors' in result.error) {
      // Convert string errors to string array format
      const fieldErrors: Record<string, string[]> = {};
      Object.entries(result.error.fieldErrors).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          fieldErrors[key] = value;
        } else {
          fieldErrors[key] = [value];
        }
      });
      return {
        ...EMPTY_ACTION_STATE,
        fieldErrors,
      };
    }
    return {
      ...EMPTY_ACTION_STATE,
      message: 'An error occurred while saving the status.',
    };
  }

  return {
    ...EMPTY_ACTION_STATE,
    message: id ? 'Status updated successfully!' : 'Status created successfully!',
  };
}
