"use server";

import type { ActionState} from '@/lib/error-handler';
import { EMPTY_ACTION_STATE } from '@/lib/error-handler';
import type { HistoryInput } from '@/schemas/history.schema';

import { createHistory, updateHistory } from './actions';

export async function historyFormAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = formData.get('id') as string;
  
  const input: HistoryInput = {
    order_id: formData.get('order_id') as string,
    status_id: formData.get('status_id') as string || null,
    change_date: formData.get('change_date') as string,
    observations: formData.get('observations') as string || null,
  };

  let result;
  if (id) {
    result = await updateHistory(id, input as any);
  } else {
    result = await createHistory(input as any);
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
      message: 'An error occurred while saving the history.',
    };
  }

  return {
    ...EMPTY_ACTION_STATE,
    message: id ? 'History updated successfully!' : 'History created successfully!',
  };
}