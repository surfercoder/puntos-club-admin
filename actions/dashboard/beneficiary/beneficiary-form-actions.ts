"use server";

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

import { createBeneficiary, updateBeneficiary } from '@/actions/dashboard/beneficiary/actions';
import { cleanFormData, fromErrorToActionState, toActionState, type ActionState } from '@/lib/error-handler';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { enforcePlanLimit } from '@/lib/plans/usage';
import { createClient } from '@/lib/supabase/server';
import { BeneficiarySchema } from '@/schemas/beneficiary.schema';
import type { Beneficiary } from '@/types/beneficiary';

export async function beneficiaryFormAction(_prevState: ActionState, formData: FormData) {
  try {
    const formDataObject = cleanFormData(formData);
    const parsed = BeneficiarySchema.safeParse(formDataObject);

    if (!parsed.success) {
      return fromErrorToActionState(parsed.error);
    }

    const isCreate = !formDataObject.id;
    const currentUser = await getCurrentUser();
    const orgId = currentUser?.organization_id ? Number(currentUser.organization_id) : null;

    // Enforce plan limit on create
    if (isCreate && orgId) {
      const limitError = await enforcePlanLimit(orgId, 'beneficiaries');
      if (limitError) return limitError;
    }

    if (isCreate) {
      const result = await createBeneficiary(parsed.data as Beneficiary);

      // Link the new beneficiary to the active organization
      if (result.data?.id) {
        const cookieStore = await cookies();
        const activeOrgId = cookieStore.get('active_org_id')?.value;
        const activeOrgIdNumber = activeOrgId ? Number(activeOrgId) : orgId;

        if (activeOrgIdNumber && !Number.isNaN(activeOrgIdNumber)) {
          const supabase = await createClient();
          await supabase.from('beneficiary_organization').insert({
            beneficiary_id: result.data.id,
            organization_id: activeOrgIdNumber,
          });
        }
      }
    } else {
      await updateBeneficiary(formDataObject.id as string, parsed.data as Beneficiary);
    }

    // Revalidate the beneficiary list page
    revalidatePath('/dashboard/beneficiary');

    return toActionState(isCreate ? 'Beneficiary created successfully!' : 'Beneficiary updated successfully!');
  } catch (error) {
    return fromErrorToActionState(error);
  }
}
