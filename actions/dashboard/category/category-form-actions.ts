"use server";

import { createCategory, updateCategory } from './actions';
import { CategoryInput } from '@/schemas/category.schema';
import { ActionState, EMPTY_ACTION_STATE } from '@/lib/error-handler';

export async function categoryFormAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = formData.get('id') as string;
  
  const input: CategoryInput = {
    name: formData.get('name') as string,
    description: formData.get('description') as string || null,
    active: formData.get('active') === 'on',
  };

  let result;
  if (id) {
    result = await updateCategory(id, input as any);
  } else {
    result = await createCategory(input as any);
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
      message: 'An error occurred while saving the category.',
    };
  }

  return {
    ...EMPTY_ACTION_STATE,
    message: id ? 'Category updated successfully!' : 'Category created successfully!',
  };
}
