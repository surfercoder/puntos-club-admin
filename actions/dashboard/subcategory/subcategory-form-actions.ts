"use server";

import type { ActionState} from '@/lib/error-handler';
import { EMPTY_ACTION_STATE } from '@/lib/error-handler';
import type { SubcategoryInput } from '@/schemas/subcategory.schema';

import { createSubcategory, updateSubcategory } from './actions';

export async function subcategoryFormAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = formData.get('id') as string;
  
  const input: SubcategoryInput = {
    category_id: formData.get('category_id') as string,
    name: formData.get('name') as string,
    description: formData.get('description') as string || null,
    active: formData.get('active') === 'on',
  };

  let result;
  if (id) {
    result = await updateSubcategory(id, input);
  } else {
    result = await createSubcategory(input);
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
      message: 'An error occurred while saving the subcategory.',
    };
  }

  return {
    ...EMPTY_ACTION_STATE,
    message: id ? 'Subcategory updated successfully!' : 'Subcategory created successfully!',
  };
}