"use server";

import { revalidatePath } from 'next/cache';

import { createBranch, updateBranch } from '@/actions/dashboard/branch/actions';
import { cleanFormData, fromErrorToActionState, toActionState, type ActionState } from '@/lib/error-handler';
import { BranchSchema } from '@/schemas/branch.schema';
import type { Branch } from '@/types/branch';

export async function branchFormAction(_prevState: ActionState, formData: FormData) {
  try {
    const formDataObject = cleanFormData(formData);
    const parsed = BranchSchema.safeParse(formDataObject);

    if (!parsed.success) {
      return fromErrorToActionState(parsed.error);
    }

    if (formDataObject.id) {
      await updateBranch(formDataObject.id as string, parsed.data as Branch);
    } else {
      await createBranch(parsed.data as Branch);
    }

    // Revalidate the branch list page
    revalidatePath('/dashboard/branch');

    return toActionState(formDataObject.id ? 'Branch updated successfully!' : 'Branch created successfully!');
  } catch (error) {
    return fromErrorToActionState(error);
  }
}
