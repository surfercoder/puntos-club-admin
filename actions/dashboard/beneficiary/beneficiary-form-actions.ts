"use server";

import { createBeneficiary, updateBeneficiary } from './actions';
import { BeneficiaryInput } from '@/schemas/beneficiary.schema';
import { ActionState, EMPTY_ACTION_STATE } from '@/lib/error-handler';

export async function beneficiaryFormAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = formData.get('id') as string;
  
  const input: BeneficiaryInput = {
    first_name: formData.get('first_name') as string || null,
    last_name: formData.get('last_name') as string || null,
    email: formData.get('email') as string || null,
    phone: formData.get('phone') as string || null,
    document_id: formData.get('document_id') as string || null,
    available_points: formData.get('available_points') as string || '0',
  };

  let result;
  if (id) {
    result = await updateBeneficiary(id, input as any);
  } else {
    result = await createBeneficiary(input as any);
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
      message: 'An error occurred while saving the beneficiary.',
    };
  }

  return {
    ...EMPTY_ACTION_STATE,
    message: id ? 'Beneficiary updated successfully!' : 'Beneficiary created successfully!',
  };
}
