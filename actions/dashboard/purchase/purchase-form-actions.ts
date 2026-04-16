'use server';

import { cookies } from 'next/headers';
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

  // Get active org from cookies — never trust client-submitted org_id
  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;
  const parsedOrgId = activeOrgId ? parseInt(activeOrgId, 10) : NaN;
  const orgIdNumber = Number.isFinite(parsedOrgId) ? parsedOrgId : null;

  const supabase = await createClient();
  const isUpdate = !!formDataObject.id;

  // Calculate points using the database function (same as mobile)
  const branchId = parsed.data.branch_id ? parseInt(parsed.data.branch_id, 10) : null;
  const { data: pointsData } = await supabase.rpc('calculate_points_for_amount', {
    p_amount: parsed.data.total_amount,
    p_organization_id: orgIdNumber,
    p_branch_id: branchId,
    p_category_id: null,
  });
  const pointsEarned = pointsData || 0;

  const dataToSave = {
    ...parsed.data,
    organization_id: orgIdNumber,
    points_earned: pointsEarned,
  };

  if (isUpdate) {
    const query = supabase
      .from('purchase')
      .update(dataToSave)
      .eq('id', formDataObject.id);

    // Scope update to current org to prevent cross-org edits
    if (orgIdNumber) {
      query.eq('organization_id', orgIdNumber);
    }

    const { error } = await query.select().single();

    if (error) {
      return fromErrorToActionState(error);
    }
  } else {
    const { error } = await supabase
      .from('purchase')
      .insert([dataToSave])
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
