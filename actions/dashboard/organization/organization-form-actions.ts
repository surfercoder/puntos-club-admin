'use server';

import { revalidatePath } from 'next/cache';

import { createOrganization, updateOrganization } from '@/actions/dashboard/organization/actions';
import { cleanFormData, fromErrorToActionState, toActionState, type ActionState } from '@/lib/error-handler';
import { OrganizationSchema } from '@/schemas/organization.schema';
import type { Organization } from '@/types/organization';

export async function organizationFormAction(_prevState: ActionState, formData: FormData) {
  try {
    const formDataObject = cleanFormData(formData);
    const parsed = OrganizationSchema.safeParse(formDataObject);

    if (!parsed.success) {
      return await fromErrorToActionState(parsed.error);
    }

    // `create*`/`update*` NO tiran: devuelven { data, error }. Sin este
    // chequeo un INSERT fallado seguia de largo y el form contestaba "guardado
    // con exito". Se relanza para que el catch de abajo lo traduzca por `code`.
    const result = formDataObject.id
      ? await updateOrganization(String(formDataObject.id), parsed.data as Organization)
      : await createOrganization(parsed.data as Organization);

    if (result.error) throw result.error;

    // Revalidate the organization list page
    revalidatePath('/dashboard/organization');
    revalidatePath('/dashboard');

    return await toActionState(formDataObject.id ? 'organizationUpdated' : 'organizationCreated');
  } catch (error) {
    return await fromErrorToActionState(error);
  }
}
