'use server';

import { revalidatePath } from 'next/cache';

import { createOrganization, updateOrganization } from '@/actions/dashboard/organization/actions';
import { fromErrorToActionState, toActionState, type ActionState } from '@/lib/error-handler';
import { OrganizationSchema } from '@/schemas/organization.schema';
import type { Organization } from '@/types/organization';

export async function organizationFormAction(_prevState: ActionState, formData: FormData) {
  try {
    const parsed = OrganizationSchema.safeParse(Object.fromEntries(formData));

    if (!parsed.success) {
      return fromErrorToActionState(parsed.error);
    }

    if (formData.get('id')) {
      await updateOrganization(String(formData.get('id')), parsed.data as Organization);
    } else {
      await createOrganization(parsed.data as Organization);
    }

    // Revalidate the organization list page
    revalidatePath('/dashboard/organization');

    return toActionState(formData.get('id') ? 'Organization updated successfully!' : 'Organization created successfully!');
  } catch (error) {
    return fromErrorToActionState(error);
  }
}
