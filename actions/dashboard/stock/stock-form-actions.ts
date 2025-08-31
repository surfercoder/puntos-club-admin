'use server';

import { revalidatePath } from 'next/cache';

import { createStock, updateStock } from '@/actions/dashboard/stock/actions';
import { fromErrorToActionState, toActionState, type ActionState } from '@/lib/error-handler';
import { StockSchema } from '@/schemas/stock.schema';
import type { Stock } from '@/types/stock';

export async function stockFormAction(_prevState: ActionState, formData: FormData) {
  try {
    const parsed = StockSchema.safeParse(Object.fromEntries(formData));

    if (!parsed.success) {
      return fromErrorToActionState(parsed.error);
    }

    if (formData.get('id')) {
      await updateStock(String(formData.get('id')), parsed.data as Stock);
    } else {
      await createStock(parsed.data as Stock);
    }

    // Revalidate the stock list page
    revalidatePath('/dashboard/stock');

    return toActionState(formData.get('id') ? 'Stock updated successfully!' : 'Stock created successfully!');
  } catch (error) {
    return fromErrorToActionState(error);
  }
}