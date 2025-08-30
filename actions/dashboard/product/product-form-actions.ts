"use server";

import type { ActionState} from '@/lib/error-handler';
import { EMPTY_ACTION_STATE } from '@/lib/error-handler';
import type { ProductInput } from '@/schemas/product.schema';

import { createProduct, updateProduct } from './actions';

export async function productFormAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = formData.get('id') as string;
  
  const input: ProductInput = {
    subcategory_id: formData.get('subcategory_id') as string,
    name: formData.get('name') as string,
    description: formData.get('description') as string || null,
    required_points: parseInt(formData.get('required_points') as string) || 0,
    active: formData.get('active') === 'on',
  };

  let result;
  if (id) {
    result = await updateProduct(id, input);
  } else {
    result = await createProduct(input);
  }

  if (result.error || !result.data) {
    if (result.error && 'fieldErrors' in result.error && result.error.fieldErrors) {
      // Convert string errors to string array format
      const fieldErrors: Record<string, string[]> = {};
      Object.entries(result.error.fieldErrors).forEach(([key, value]) => {
        fieldErrors[key] = Array.isArray(value) ? value : [value as string];
      });
      return {
        ...EMPTY_ACTION_STATE,
        fieldErrors,
      };
    }
    return {
      ...EMPTY_ACTION_STATE,
      message: 'An error occurred while saving the product.',
    };
  }

  return {
    ...EMPTY_ACTION_STATE,
    message: id ? 'Product updated successfully!' : 'Product created successfully!',
  };
}