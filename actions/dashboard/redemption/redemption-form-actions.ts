'use server';

import { revalidatePath } from 'next/cache';

import { createRedemption, updateRedemption } from '@/actions/dashboard/redemption/actions';
import { fromErrorToActionState, toActionState, type ActionState } from '@/lib/error-handler';
import { RedemptionSchema } from '@/schemas/redemption.schema';
import type { Redemption } from '@/types/redemption';

export async function redemptionFormAction(_prevState: ActionState, formData: FormData) {
  try {
    const parsed = RedemptionSchema.safeParse(Object.fromEntries(formData));

    if (!parsed.success) {
      return fromErrorToActionState(parsed.error);
    }

    const redemptionData = {
      ...parsed.data,
      redemption_date: new Date().toISOString(),
    };

    if (formData.get('id')) {
      await updateRedemption(String(formData.get('id')), redemptionData as Redemption);
    } else {
      await createRedemption(redemptionData as Redemption);
    }

    // Revalidate the redemption list page
    revalidatePath('/dashboard/redemption');

    return toActionState(formData.get('id') ? 'Redemption updated successfully!' : 'Redemption created successfully!');
  } catch (error) {
    return fromErrorToActionState(error);
  }
}