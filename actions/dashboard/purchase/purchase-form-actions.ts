'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { cleanFormData, fromErrorToActionState, type ActionState } from '@/lib/error-handler';
import { PurchaseSchema } from '@/schemas/purchase.schema';
import { createClient } from '@/lib/supabase/server';

export async function purchaseFormAction(_prevState: ActionState, formData: FormData) {
  const formDataObject = cleanFormData(formData);
  const parsed = PurchaseSchema.safeParse(formDataObject);

  if (!parsed.success) {
    return fromErrorToActionState(parsed.error);
  }

  const supabase = await createClient();
  const isUpdate = !!formDataObject.id;

  if (isUpdate) {
    const { error } = await supabase
      .from('purchase')
      .update(parsed.data)
      .eq('id', formDataObject.id)
      .select()
      .single();

    if (error) {
      return fromErrorToActionState(error);
    }
  } else {
    const { error } = await supabase
      .from('purchase')
      .insert([parsed.data])
      .select()
      .single();

    if (error) {
      return fromErrorToActionState(error);
    }
  }

  revalidatePath('/dashboard/purchase');
  const message = isUpdate ? 'Purchase updated successfully!' : 'Purchase created successfully!';
  redirect(`/dashboard/purchase?success=${encodeURIComponent(message)}`);
}
