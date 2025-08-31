'use server';

import { revalidatePath } from 'next/cache';

import { createStatus, updateStatus } from '@/actions/dashboard/status/actions';
import { fromErrorToActionState, toActionState, type ActionState } from '@/lib/error-handler';
import { StatusSchema } from '@/schemas/status.schema';
import type { Status } from '@/types/status';

export async function statusFormAction(_prevState: ActionState, formData: FormData) {
  try {
    const parsed = StatusSchema.safeParse(Object.fromEntries(formData));

    if (!parsed.success) {
      return fromErrorToActionState(parsed.error);
    }

    if (formData.get('id')) {
      await updateStatus(String(formData.get('id')), parsed.data as Status);
    } else {
      await createStatus(parsed.data as Status);
    }

    // Revalidate the status list page
    revalidatePath('/dashboard/status');

    return toActionState(formData.get('id') ? 'Status updated successfully!' : 'Status created successfully!');
  } catch (error) {
    return fromErrorToActionState(error);
  }
}
