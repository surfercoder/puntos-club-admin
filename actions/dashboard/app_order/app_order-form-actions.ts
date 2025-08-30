"use server";

import type { ActionState} from '@/lib/error-handler';
import { EMPTY_ACTION_STATE } from '@/lib/error-handler';
import type { AppOrderInput } from '@/schemas/app_order.schema';

import { createAppOrder, updateAppOrder } from './actions';

export async function appOrderFormAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = formData.get('id') as string;
  
  const input: AppOrderInput = {
    order_number: formData.get('order_number') as string,
    creation_date: formData.get('creation_date') as string,
    total_points: parseInt(formData.get('total_points') as string) || 0,
    observations: formData.get('observations') as string || null,
  };

  let result;
  if (id) {
    result = await updateAppOrder(id, input);
  } else {
    result = await createAppOrder(input);
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
      message: 'An error occurred while saving the order.',
    };
  }

  return {
    ...EMPTY_ACTION_STATE,
    message: id ? 'Order updated successfully!' : 'Order created successfully!',
  };
}