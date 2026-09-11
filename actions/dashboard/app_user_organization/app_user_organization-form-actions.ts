'use server';

import { revalidatePath } from 'next/cache';

import {
  createAppUserOrganization,
  updateAppUserOrganization,
} from '@/actions/dashboard/app_user_organization/actions';
import { cleanFormData, fromErrorToActionState, toActionState, type ActionState } from '@/lib/error-handler';
import { AppUserOrganizationSchema } from '@/schemas/app_user_organization.schema';
import type { AppUserOrganization } from '@/schemas/app_user_organization.schema';

export async function appUserOrganizationFormAction(_prevState: ActionState, formData: FormData) {
  try {
    const formDataObject = cleanFormData(formData);
    const parsed = AppUserOrganizationSchema.safeParse(formDataObject);

    if (!parsed.success) {
      return await fromErrorToActionState(parsed.error);
    }

    // `create*`/`update*` NO tiran: devuelven { data, error }. Sin este
    // chequeo un INSERT fallado seguia de largo y el form contestaba "guardado
    // con exito". Se relanza para que el catch de abajo lo traduzca por `code`.
    const result = formDataObject.id
      ? await updateAppUserOrganization(String(formDataObject.id), parsed.data as AppUserOrganization)
      : await createAppUserOrganization(parsed.data as AppUserOrganization);

    if (result.error) throw result.error;

    revalidatePath('/dashboard/app_user_organization');

    return await toActionState(formDataObject.id ? 'membershipUpdated' : 'membershipCreated');
  } catch (error) {
    return await fromErrorToActionState(error);
  }
}
