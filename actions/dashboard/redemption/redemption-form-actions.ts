"use server";

import { createRedemption, updateRedemption } from './actions';
import { RedemptionInput } from '@/schemas/redemption.schema';
import { ActionState, EMPTY_ACTION_STATE } from '@/lib/error-handler';

export async function redemptionFormAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = formData.get('id') as string;
  
  const input: RedemptionInput = {
    beneficiary_id: formData.get('beneficiary_id') as string,
    product_id: formData.get('product_id') as string || null,
    order_id: formData.get('order_id') as string,
    points_used: parseInt(formData.get('points_used') as string) || 0,
    quantity: parseInt(formData.get('quantity') as string) || 0,
    redemption_date: formData.get('redemption_date') as string,
  };

  let result;
  if (id) {
    result = await updateRedemption(id, input as any);
  } else {
    result = await createRedemption(input as any);
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
      message: 'An error occurred while saving the redemption.',
    };
  }

  return {
    ...EMPTY_ACTION_STATE,
    message: id ? 'Redemption updated successfully!' : 'Redemption created successfully!',
  };
}