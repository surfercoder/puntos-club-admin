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
      return fromErrorToActionState(parsed.error);
    }

    if (formDataObject.id) {
      await updateOrganization(String(formDataObject.id), parsed.data as Organization);
    } else {
      await createOrganization(parsed.data as Organization);
    }

    // Revalidate the organization list page
    revalidatePath('/dashboard/organization');
    revalidatePath('/dashboard');

    return toActionState(formDataObject.id ? 'Organization updated successfully!' : 'Organization created successfully!');
  } catch (error) {
    return fromErrorToActionState(error);
  }
}
