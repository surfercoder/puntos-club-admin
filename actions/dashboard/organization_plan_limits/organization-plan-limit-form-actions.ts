'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createOrganizationPlanLimit, updateOrganizationPlanLimit } from '@/actions/dashboard/organization_plan_limits/actions';
import { cleanFormData, fromErrorToActionState, type ActionState } from '@/lib/error-handler';
import { OrganizationPlanLimitSchema } from '@/schemas/organization_plan_limit.schema';
import type { OrganizationPlanLimit } from '@/types/organization_plan_limit';

export async function organizationPlanLimitFormAction(_prevState: ActionState, formData: FormData) {
  const formDataObject = cleanFormData(formData);
  const parsed = OrganizationPlanLimitSchema.safeParse(formDataObject);

  if (!parsed.success) {
    return fromErrorToActionState(parsed.error);
  }

  const isUpdate = !!formDataObject.id;
  const result = isUpdate
    ? await updateOrganizationPlanLimit(String(formDataObject.id), parsed.data as OrganizationPlanLimit)
    : await createOrganizationPlanLimit(parsed.data as OrganizationPlanLimit);

  if (result.error) {
    return fromErrorToActionState(result.error);
  }

  revalidatePath('/dashboard/organization_plan_limits');
  const message = isUpdate ? 'Organization plan limit updated successfully!' : 'Organization plan limit created successfully!';
  redirect(`/dashboard/organization_plan_limits?success=${encodeURIComponent(message)}`);
}
