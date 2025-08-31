"use server";

import { revalidatePath } from 'next/cache';

import { createBranch, updateBranch } from '@/actions/dashboard/branch/actions';
import { fromErrorToActionState, toActionState, type ActionState } from '@/lib/error-handler';
import { BranchSchema } from '@/schemas/branch.schema';
import type { Branch } from '@/types/branch';

export async function branchFormAction(_prevState: ActionState, formData: FormData) {
  try {
    const parsed = BranchSchema.safeParse(Object.fromEntries(formData));

    if (!parsed.success) {
      return fromErrorToActionState(parsed.error);
    }

    if (formData.get('id')) {
      await updateBranch(formData.get('id') as string, parsed.data as Branch);
    } else {
      await createBranch(parsed.data as Branch);
    }

    // Revalidate the branch list page
    revalidatePath('/dashboard/branch');

    return toActionState(formData.get('id') ? 'Branch updated successfully!' : 'Branch created successfully!');
  } catch (error) {
    return fromErrorToActionState(error);
  }
}
