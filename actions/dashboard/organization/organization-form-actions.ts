"use server";

import { createOrganization, updateOrganization } from './actions';
import { OrganizationInput } from '@/schemas/organization.schema';
import { ActionState, EMPTY_ACTION_STATE } from '@/lib/error-handler';

export async function organizationFormAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = formData.get('id') as string;
  
  const input: OrganizationInput = {
    name: formData.get('name') as string,
    business_name: formData.get('business_name') as string || null,
    tax_id: formData.get('tax_id') as string || null,
  };

  let result;
  if (id) {
    result = await updateOrganization(id, input as any);
  } else {
    result = await createOrganization(input as any);
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
      message: 'An error occurred while saving the organization.',
    };
  }

  return {
    ...EMPTY_ACTION_STATE,
    message: id ? 'Organization updated successfully!' : 'Organization created successfully!',
  };
}
