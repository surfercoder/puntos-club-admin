'use server';

import { revalidatePath } from 'next/cache';

import { createRedemption, updateRedemption } from '@/actions/dashboard/redemption/actions';
import { cleanFormData, fromErrorToActionState, toActionState, type ActionState } from '@/lib/error-handler';
import { RedemptionSchema } from '@/schemas/redemption.schema';
import type { Redemption } from '@/types/redemption';

export async function redemptionFormAction(_prevState: ActionState, formData: FormData) {
  try {
    const formDataObject = cleanFormData(formData);
    const parsed = RedemptionSchema.safeParse(formDataObject);

    if (!parsed.success) {
      return fromErrorToActionState(parsed.error);
    }

    const redemptionData = {
      ...parsed.data,
      redemption_date: new Date().toISOString(),
    };

    if (formDataObject.id) {
      await updateRedemption(String(formDataObject.id), redemptionData as Redemption);
    } else {
      await createRedemption(redemptionData as Redemption);
    }

    // Revalidate the redemption list page
    revalidatePath('/dashboard/redemption');

    return toActionState(formDataObject.id ? 'Redemption updated successfully!' : 'Redemption created successfully!');
  } catch (error) {
    return fromErrorToActionState(error);
  }
}