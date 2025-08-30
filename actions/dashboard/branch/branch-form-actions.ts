"use server";

import type { ActionState} from '@/lib/error-handler';
import { EMPTY_ACTION_STATE } from '@/lib/error-handler';
import type { BranchInput } from '@/schemas/branch.schema';

import { createBranch, updateBranch } from './actions';

export async function branchFormAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = formData.get('id') as string;
  
  const addressId = formData.get('address_id') as string;
  
  const input: BranchInput = {
    organization_id: formData.get('organization_id') as string,
    address_id: addressId === 'none' || addressId === '' ? null : addressId,
    name: formData.get('name') as string,
    code: formData.get('code') as string || null,
    phone: formData.get('phone') as string || null,
    active: formData.get('active') === 'true',
  };

  let result;
  if (id) {
    result = await updateBranch(id, input);
  } else {
    result = await createBranch(input);
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
      message: 'An error occurred while saving the branch.',
    };
  }

  return {
    ...EMPTY_ACTION_STATE,
    message: id ? 'Branch updated successfully!' : 'Branch created successfully!',
  };
}
