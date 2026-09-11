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
      return await fromErrorToActionState(parsed.error);
    }

    // `create*`/`update*` NO tiran: devuelven { data, error }. Sin este
    // chequeo un INSERT fallado seguia de largo y el form contestaba "guardado
    // con exito". Se relanza para que el catch de abajo lo traduzca por `code`.
    const result = formDataObject.id
      ? await updateBranch(formDataObject.id as string, parsed.data as Branch)
      : await createBranch(parsed.data as Branch);

    if (result.error) throw result.error;

    // Revalidate the branch list page
    revalidatePath('/dashboard/branch');

    return await toActionState(formDataObject.id ? 'branchUpdated' : 'branchCreated');
  } catch (error) {
    return await fromErrorToActionState(error);
  }
}
