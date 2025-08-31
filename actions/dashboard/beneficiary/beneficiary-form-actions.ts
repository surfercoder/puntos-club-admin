"use server";

import { revalidatePath } from 'next/cache';

import { createBeneficiary, updateBeneficiary } from '@/actions/dashboard/beneficiary/actions';
import { fromErrorToActionState, toActionState, type ActionState } from '@/lib/error-handler';
import { BeneficiarySchema } from '@/schemas/beneficiary.schema';
import type { Beneficiary } from '@/types/beneficiary';

export async function beneficiaryFormAction(_prevState: ActionState, formData: FormData) {
  try {
    const parsed = BeneficiarySchema.safeParse(Object.fromEntries(formData));

    if (!parsed.success) {
      return fromErrorToActionState(parsed.error);
    }

    if (formData.get('id')) {
      await updateBeneficiary(formData.get('id') as string, parsed.data as Beneficiary);
    } else {
      await createBeneficiary(parsed.data as Beneficiary);
    }

    // Revalidate the beneficiary list page
    revalidatePath('/dashboard/beneficiary');

    return toActionState(formData.get('id') ? 'Beneficiary updated successfully!' : 'Beneficiary created successfully!');
  } catch (error) {
    return fromErrorToActionState(error);
  }
}
