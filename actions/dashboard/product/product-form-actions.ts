'use server';

import { revalidatePath } from 'next/cache';

import { createProduct, updateProduct } from '@/actions/dashboard/product/actions';
import { fromErrorToActionState, toActionState, type ActionState } from '@/lib/error-handler';
import { ProductSchema } from '@/schemas/product.schema';
import type { Product } from '@/types/product';

export async function productFormAction(_prevState: ActionState, formData: FormData) {
  try {
    const parsed = ProductSchema.safeParse(Object.fromEntries(formData));

    if (!parsed.success) {
      return fromErrorToActionState(parsed.error);
    }

    if (formData.get('id')) {
      await updateProduct(String(formData.get('id')), parsed.data as Product);
    } else {
      await createProduct(parsed.data as Product);
    }

    // Revalidate the product list page
    revalidatePath('/dashboard/product');

    return toActionState(formData.get('id') ? 'Product updated successfully!' : 'Product created successfully!');
  } catch (error) {
    return fromErrorToActionState(error);
  }
}