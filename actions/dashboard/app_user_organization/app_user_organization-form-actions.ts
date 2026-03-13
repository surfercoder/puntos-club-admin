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
      return fromErrorToActionState(parsed.error);
    }

    if (formDataObject.id) {
      await updateAppUserOrganization(String(formDataObject.id), parsed.data as AppUserOrganization);
    } else {
      await createAppUserOrganization(parsed.data as AppUserOrganization);
    }

    revalidatePath('/dashboard/app_user_organization');

    return toActionState(formDataObject.id ? 'Membership updated successfully!' : 'Membership created successfully!');
  } catch (error) {
    return fromErrorToActionState(error);
  }
}
