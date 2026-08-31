"use server";

import { revalidatePath } from 'next/cache';

import { createAppUser, updateAppUser } from '@/actions/dashboard/app_user/actions';
import { assignCashierToBranch, checkBranchInActiveOrg } from '@/actions/dashboard/branch/assign-cashier';
import { cleanFormData, fromErrorToActionState, toActionState, type ActionState } from '@/lib/error-handler';
import { AppUserSchema } from '@/schemas/app_user.schema';

export async function appUserFormAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const formDataObject = cleanFormData(formData);
    const parsed = AppUserSchema.safeParse(formDataObject);

    if (!parsed.success) {
      return fromErrorToActionState(parsed.error);
    }

    // Distinguimos "el form no trae el campo" (no tocar la sucursal) de "lo trae
    // vacío" (el owner la liberó y hay que desasignarla).
    const hasBranchField = 'branch_id' in formDataObject;
    // La sucursal se valida antes de crear nada: si falla después, el app_user
    // y su usuario de Auth ya existen y el email queda tomado para el reintento.
    const branchId = formDataObject.branch_id ? String(formDataObject.branch_id) : '';
    // El campo solo viaja cuando el rol elegido es cajero, y un cajero sin
    // sucursal no puede operar: se crean las sucursales primero.
    if (hasBranchField && !branchId) {
      return {
        status: 'error' as const,
        message: 'BRANCH_REQUIRED',
        fieldErrors: { branch_id: ['BRANCH_REQUIRED'] },
      };
    }
    if (branchId) {
      const branchCheck = await checkBranchInActiveOrg(branchId);
      if (branchCheck.error) {
        return { status: 'error' as const, message: branchCheck.error.message, fieldErrors: {} };
      }
    }

    const result = formDataObject.id
      ? await updateAppUser(formDataObject.id as string, parsed.data)
      : await createAppUser(parsed.data);

    if (result.error) {
      const message = 'message' in result.error
        ? (result.error.message ?? 'An unexpected error occurred')
        : 'An unexpected error occurred';
      return { status: 'error' as const, message, fieldErrors: {} };
    }

    // La sucursal del cajero vive en app_user.branch_id y se guarda aparte para
    // reusar la validación de que la sucursal sea de la misma organización.
    const savedId = formDataObject.id
      ? String(formDataObject.id)
      : String((result.data as { id?: string | number } | null)?.id ?? '');

    if (hasBranchField && savedId) {
      const assignment = await assignCashierToBranch(savedId, branchId);
      if (assignment.error) {
        return { status: 'error' as const, message: assignment.error.message, fieldErrors: {} };
      }
    }

    // Revalidate the app user list page
    revalidatePath('/dashboard/app_user');
    revalidatePath('/dashboard/cashiers');
    revalidatePath('/dashboard/collaborators');

    return toActionState(formDataObject.id ? 'App User updated successfully!' : 'App User created successfully!');
  } catch (error) {
    return fromErrorToActionState(error);
  }
}