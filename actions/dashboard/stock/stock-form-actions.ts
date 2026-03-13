'use server';

import { revalidatePath } from 'next/cache';

import { createStock, updateStock } from '@/actions/dashboard/stock/actions';
import { cleanFormData, fromErrorToActionState, toActionState, type ActionState } from '@/lib/error-handler';
import { StockSchema } from '@/schemas/stock.schema';
import type { Stock } from '@/types/stock';

export async function stockFormAction(_prevState: ActionState, formData: FormData) {
  try {
    const formDataObject = cleanFormData(formData);
    const parsed = StockSchema.safeParse(formDataObject);

    if (!parsed.success) {
      return fromErrorToActionState(parsed.error);
    }

    if (formDataObject.id) {
      await updateStock(String(formDataObject.id), parsed.data as Stock);
    } else {
      await createStock(parsed.data as Stock);
    }

    // Revalidate the stock list page
    revalidatePath('/dashboard/stock');

    return toActionState(formDataObject.id ? 'Stock updated successfully!' : 'Stock created successfully!');
  } catch (error) {
    return fromErrorToActionState(error);
  }
}