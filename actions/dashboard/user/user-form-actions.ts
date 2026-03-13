'use server';

import { revalidatePath } from 'next/cache';

import { createUser, updateUser } from '@/actions/dashboard/user/actions';
import { cleanFormData, fromErrorToActionState, toActionState, type ActionState } from '@/lib/error-handler';
import { enforcePlanLimit } from '@/lib/plans/usage';
import { createClient } from '@/lib/supabase/server';
import { UserSchema } from '@/schemas/user.schema';
import type { PlanFeatureKey } from '@/types/plan';
import type { User } from '@/types/user';

const ROLE_FEATURE_MAP: Record<string, PlanFeatureKey> = {
  cashier: 'cashiers',
  collaborator: 'collaborators',
};

export async function userFormAction(_prevState: ActionState, formData: FormData) {
  try {
    const formDataObject = cleanFormData(formData);
    const parsed = UserSchema.safeParse(formDataObject);

    if (!parsed.success) {
      return fromErrorToActionState(parsed.error);
    }

    const isCreate = !formDataObject.id;

    // Enforce plan limit on create for cashier/collaborator roles
    if (isCreate && parsed.data.role_id && parsed.data.organization_id) {
      const supabase = await createClient();
      const { data: roleData } = await supabase
        .from('user_role')
        .select('name')
        .eq('id', parsed.data.role_id)
        .single();

      const feature = roleData?.name ? ROLE_FEATURE_MAP[roleData.name] : undefined;
      if (feature) {
        const limitError = await enforcePlanLimit(Number(parsed.data.organization_id), feature);
        if (limitError) return limitError;
      }
    }

    if (isCreate) {
      await createUser(parsed.data as User);
    } else {
      await updateUser(String(formDataObject.id), parsed.data as User);
    }

    // Revalidate the user list page
    revalidatePath('/dashboard/users');

    return toActionState(isCreate ? 'User created successfully!' : 'User updated successfully!');
  } catch (error) {
    return fromErrorToActionState(error);
  }
}
