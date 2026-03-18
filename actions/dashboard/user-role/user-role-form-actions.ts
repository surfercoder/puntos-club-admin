'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { cleanFormData, fromErrorToActionState, type ActionState } from '@/lib/error-handler';
import { UserRoleSchema } from '@/schemas/user_role.schema';
import { createClient } from '@/lib/supabase/server';

export async function userRoleFormAction(_prevState: ActionState, formData: FormData) {
  const formDataObject = cleanFormData(formData);
  const parsed = UserRoleSchema.safeParse(formDataObject);

  if (!parsed.success) {
    return fromErrorToActionState(parsed.error);
  }

  const supabase = await createClient();
  const isUpdate = !!formDataObject.id;

  if (isUpdate) {
    const { error } = await supabase
      .from('user_role')
      .update({
        display_name: parsed.data.display_name,
        description: parsed.data.description,
      })
      .eq('id', formDataObject.id)
      .select()
      .single();

    if (error) {
      return fromErrorToActionState(error);
    }
  } else {
    const { error } = await supabase
      .from('user_role')
      .insert([parsed.data])
      .select()
      .single();

    if (error) {
      return fromErrorToActionState(error);
    }
  }

  revalidatePath('/dashboard/user-role');
  const message = isUpdate ? 'User role updated successfully!' : 'User role created successfully!';
  redirect(`/dashboard/user-role?success=${encodeURIComponent(message)}`);
}
