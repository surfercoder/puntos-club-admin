"use server";

import type { ActionState} from '@/lib/error-handler';
import { EMPTY_ACTION_STATE } from '@/lib/error-handler';
import type { StockInput } from '@/schemas/stock.schema';

import { createStock, updateStock } from './actions';

export async function stockFormAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = formData.get('id') as string;
  
  const input: StockInput = {
    branch_id: formData.get('branch_id') as string,
    product_id: formData.get('product_id') as string,
    quantity: parseInt(formData.get('quantity') as string) || 0,
    minimum_quantity: parseInt(formData.get('minimum_quantity') as string) || 0,
    last_updated: formData.get('last_updated') as string,
  };

  let result;
  if (id) {
    result = await updateStock(id, input as any);
  } else {
    result = await createStock(input as any);
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
      message: 'An error occurred while saving the stock.',
    };
  }

  return {
    ...EMPTY_ACTION_STATE,
    message: id ? 'Stock updated successfully!' : 'Stock created successfully!',
  };
}