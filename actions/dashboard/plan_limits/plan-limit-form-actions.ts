'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createPlanLimit, updatePlanLimit } from '@/actions/dashboard/plan_limits/actions';
import { cleanFormData, fromErrorToActionState, type ActionState } from '@/lib/error-handler';
import { PlanLimitSchema } from '@/schemas/plan_limit.schema';

export async function planLimitFormAction(_prevState: ActionState, formData: FormData) {
  const formDataObject = cleanFormData(formData);
  const parsed = PlanLimitSchema.safeParse(formDataObject);

  if (!parsed.success) {
    return fromErrorToActionState(parsed.error);
  }

  const isUpdate = !!formDataObject.id;
  const result = isUpdate
    ? await updatePlanLimit(String(formDataObject.id), parsed.data)
    : await createPlanLimit(parsed.data);

  if (result.error) {
    return fromErrorToActionState(result.error);
  }

  revalidatePath('/dashboard/plan_limits');
  const message = isUpdate ? 'Plan limit updated successfully!' : 'Plan limit created successfully!';
  redirect(`/dashboard/plan_limits?success=${encodeURIComponent(message)}`);
}
