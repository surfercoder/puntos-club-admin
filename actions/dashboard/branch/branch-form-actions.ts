"use server";

import { createBranch, updateBranch } from './actions';
import { BranchInput } from '@/schemas/branch.schema';
import { ActionState, EMPTY_ACTION_STATE } from '@/lib/error-handler';

export async function branchFormAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = formData.get('id') as string;
  
  const addressId = formData.get('address_id') as string;
  
  const input: BranchInput = {
    organization_id: formData.get('organization_id') as string,
    address_id: addressId === 'none' ? null : addressId,
    name: formData.get('name') as string,
    code: formData.get('code') as string || null,
    phone: formData.get('phone') as string || null,
    active: formData.get('active') === 'true',
  };

  let result;
  if (id) {
    result = await updateBranch(id, input as any);
  } else {
    result = await createBranch(input as any);
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
      message: 'An error occurred while saving the branch.',
    };
  }

  return {
    ...EMPTY_ACTION_STATE,
    message: id ? 'Branch updated successfully!' : 'Branch created successfully!',
  };
}
