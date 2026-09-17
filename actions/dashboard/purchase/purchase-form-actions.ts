'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { actionMessage, cleanFormData, fromErrorToActionState, type ActionState } from '@/lib/error-handler';
import { PurchaseSchema } from '@/schemas/purchase.schema';
import { createClient } from '@/lib/supabase/server';
import { notifyPointsCredited } from '@/lib/notify-purchase';
import { requireUser } from '@/lib/auth/require-user';

export async function purchaseFormAction(_prevState: ActionState, formData: FormData) {
  const user = await requireUser();
  const formDataObject = cleanFormData(formData);
  const parsed = PurchaseSchema.safeParse(formDataObject);

  if (!parsed.success) {
    return await fromErrorToActionState(parsed.error);
  }

  // Get active org from cookies — never trust client-submitted org_id
  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;
  const parsedOrgId = activeOrgId ? parseInt(activeOrgId, 10) : NaN;
  const orgIdNumber = Number.isFinite(parsedOrgId) ? parsedOrgId : null;

  const supabase = await createClient();
  const isUpdate = !!formDataObject.id;

  const { mode, total_amount, points_earned, ...rest } = parsed.data;
  const branchId = rest.branch_id ? parseInt(rest.branch_id, 10) : null;

  let amount = 0;
  let pointsEarned: number;

  if (mode === 'assignment') {
    // Asignación manual: el owner otorga los puntos y no hay importe de venta.
    /* c8 ignore next -- el schema ya exige el campo en este modo */
    pointsEarned = points_earned ?? 0;
  } else {
    // Venta: los puntos los calcula el mismo RPC que usa la app de cajeros.
    /* c8 ignore next -- el schema ya exige el campo en este modo */
    amount = total_amount ?? 0;
    const { data: pointsData } = await supabase.rpc('calculate_points_for_amount', {
      p_amount: amount,
      p_organization_id: orgIdNumber,
      p_branch_id: branchId,
      p_category_id: null,
    });
    pointsEarned = pointsData || 0;
  }

  const dataToSave = {
    ...rest,
    total_amount: amount,
    organization_id: orgIdNumber,
    points_earned: pointsEarned,
    // Owner is always the virtual cashier. Only stamp it on create so edits
    // don't reassign the cashier of an existing purchase.
    ...(isUpdate ? {} : { cashier_id: String(user.id) }),
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
      return await fromErrorToActionState(error);
    }
  } else {
    const { error } = await supabase
      .from('purchase')
      .insert([dataToSave])
      .select()
      .single();

    if (error) {
      return await fromErrorToActionState(error);
    }

    // Misma notificacion que manda la app de cajero: sin esto, los puntos
    // cargados desde la caja virtual no le avisaban nada al beneficiario.
    // Best-effort — la compra ya esta guardada, un push caido no la voltea.
    if (pointsEarned > 0 && orgIdNumber) {
      await notifyPointsCredited({
        beneficiaryId: rest.beneficiary_id,
        organizationId: orgIdNumber,
        pointsEarned,
      }).catch(() => undefined);
    }
  }

  revalidatePath('/dashboard/purchase');
  const message = await actionMessage(isUpdate ? 'purchaseUpdated' : 'purchaseCreated');
  redirect(`/dashboard/purchase?success=${encodeURIComponent(message)}`);
}
