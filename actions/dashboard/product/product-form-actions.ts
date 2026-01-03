'use server';

import { revalidatePath } from 'next/cache';

import { createProduct, updateProduct } from '@/actions/dashboard/product/actions';
import { fromErrorToActionState, toActionState, type ActionState } from '@/lib/error-handler';
import { ProductSchema } from '@/schemas/product.schema';
import type { Product } from '@/types/product';

export async function productFormAction(_prevState: ActionState, formData: FormData) {
  try {
    const formDataObj = Object.fromEntries(formData);
    const parsed = ProductSchema.safeParse(formDataObj);

    if (!parsed.success) {
      return fromErrorToActionState(parsed.error);
    }

    let result;
    if (formData.get('id')) {
      result = await updateProduct(String(formData.get('id')), parsed.data as Product);
    } else {
      result = await createProduct(parsed.data as Product);
    }

    if (result.error) {
      return fromErrorToActionState(result.error);
    }

    // Revalidate the product list page
    revalidatePath('/dashboard/product');

    return toActionState(formData.get('id') ? 'Product updated successfully!' : 'Product created successfully!');
  } catch (error) {
    return fromErrorToActionState(error);
  }
}