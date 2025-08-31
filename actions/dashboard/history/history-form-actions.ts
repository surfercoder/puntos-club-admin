'use server';

import { revalidatePath } from 'next/cache';

import { createHistory, updateHistory } from '@/actions/dashboard/history/actions';
import { fromErrorToActionState, toActionState, type ActionState } from '@/lib/error-handler';
import { HistorySchema } from '@/schemas/history.schema';
import type { History } from '@/types/history';

export async function historyFormAction(_prevState: ActionState, formData: FormData) {
  try {
    const parsed = HistorySchema.safeParse(Object.fromEntries(formData));

    if (!parsed.success) {
      return fromErrorToActionState(parsed.error);
    }

    if (formData.get('id')) {
      await updateHistory(String(formData.get('id')), parsed.data as History);
    } else {
      await createHistory(parsed.data as History);
    }

    // Revalidate the history list page
    revalidatePath('/dashboard/history');

    return toActionState(formData.get('id') ? 'History updated successfully!' : 'History created successfully!');
  } catch (error) {
    return fromErrorToActionState(error);
  }
}