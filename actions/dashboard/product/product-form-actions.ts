'use server';

import { revalidatePath } from 'next/cache';

import { createProduct, updateProduct } from '@/actions/dashboard/product/actions';
import { cleanFormData, fromErrorToActionState, toActionState, type ActionState } from '@/lib/error-handler';
import { ProductSchema } from '@/schemas/product.schema';
import type { Product } from '@/types/product';

export async function productFormAction(_prevState: ActionState, formData: FormData) {
  try {
    const formDataObj: Record<string, FormDataEntryValue | unknown[]> = cleanFormData(formData);
    
    // Parse image_urls from JSON string
    if (formDataObj.image_urls && typeof formDataObj.image_urls === 'string') {
      try {
        formDataObj.image_urls = JSON.parse(formDataObj.image_urls) as unknown[];
      } catch {
        formDataObj.image_urls = [];
      }
    }
    
    const parsed = ProductSchema.safeParse(formDataObj);

    if (!parsed.success) {
      return fromErrorToActionState(parsed.error);
    }

    let result;
    if (formDataObj.id) {
      // Redemptions decrement product.stock in the background, so writing back the
      // absolute count the form rendered with would silently revert them (oversell).
      // Only send stock when the admin actually edited the field.
      // ponytail: last-write-wins if they did edit it — that's the intended "I counted
      // the shelf" semantic. Add an optimistic .eq('stock', loaded) guard only if two
      // admins ever restock the same product at once.
      const { stock, ...withoutStock } = parsed.data as Product;
      const stockUnchanged = String(formDataObj.stock_loaded ?? '') === String(stock);
      result = await updateProduct(String(formDataObj.id), stockUnchanged ? withoutStock : parsed.data as Product);
    } else {
      result = await createProduct(parsed.data as Product);
    }

    if (result.error) {
      return fromErrorToActionState(result.error);
    }

    // Revalidate the product list page
    revalidatePath('/dashboard/product');

    return toActionState(formDataObj.id ? 'Product updated successfully!' : 'Product created successfully!');
  } catch (error) {
    return fromErrorToActionState(error);
  }
}