'use server';

import { revalidatePath } from 'next/cache';

import {
  createBeneficiaryOrganization,
  updateBeneficiaryOrganization,
} from '@/actions/dashboard/beneficiary_organization/actions';
import { cleanFormData, fromErrorToActionState, toActionState, type ActionState } from '@/lib/error-handler';
import { BeneficiaryOrganizationSchema } from '@/schemas/beneficiary_organization.schema';
import type { BeneficiaryOrganization } from '@/schemas/beneficiary_organization.schema';

export async function beneficiaryOrganizationFormAction(_prevState: ActionState, formData: FormData) {
  try {
    const formDataObject = cleanFormData(formData);
    const parsed = BeneficiaryOrganizationSchema.safeParse(formDataObject);

    if (!parsed.success) {
      return await fromErrorToActionState(parsed.error);
    }

    if (formDataObject.id) {
      await updateBeneficiaryOrganization(String(formDataObject.id), parsed.data as BeneficiaryOrganization);
    } else {
      await createBeneficiaryOrganization(parsed.data as BeneficiaryOrganization);
    }

    revalidatePath('/dashboard/beneficiary_organization');

    return await toActionState(formDataObject.id ? 'beneficiaryMembershipUpdated' : 'beneficiaryMembershipCreated');
  } catch (error) {
    return await fromErrorToActionState(error);
  }
}
