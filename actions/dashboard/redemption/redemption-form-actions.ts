'use server';

import { revalidatePath } from 'next/cache';

import { createRedemption, updateRedemption } from '@/actions/dashboard/redemption/actions';
import { cleanFormData, fromErrorToActionState, toActionState, type ActionState } from '@/lib/error-handler';
import { RedemptionSchema } from '@/schemas/redemption.schema';
import type { Redemption } from '@/types/redemption';

// Maps the stable codes returned by the redemption RPCs into Spanish
// user-facing messages. Kept in sync with mapRpcError in actions.ts.
function messageForCode(code: string): string {
  switch (code) {
    case 'PENDING_REDEMPTION_EXISTS':
      return 'El beneficiario ya tiene un canje pendiente. Debe completarlo o cancelarlo antes de pedir otro.';
    case 'INSUFFICIENT_POINTS':
      return 'Puntos insuficientes.';
    case 'OUT_OF_STOCK':
      return 'El producto no tiene stock disponible.';
    case 'MEMBERSHIP_NOT_FOUND':
      return 'El beneficiario no pertenece a esta organización.';
    case 'MEMBERSHIP_INACTIVE':
      return 'La membresía del beneficiario está inactiva.';
    case 'PRODUCT_NOT_FOUND':
      return 'Producto no encontrado en esta organización.';
    default:
      return 'Ocurrió un error al procesar el canje.';
  }
}

export async function redemptionFormAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const formDataObject = cleanFormData(formData);
    const parsed = RedemptionSchema.safeParse(formDataObject);

    if (!parsed.success) {
      return fromErrorToActionState(parsed.error);
    }

    const redemptionData = {
      ...parsed.data,
      redemption_date: new Date().toISOString(),
    };

    if (formDataObject.id) {
      await updateRedemption(String(formDataObject.id), redemptionData as Redemption);
    } else {
      const result = await createRedemption(redemptionData as Redemption);
      const errMsg = (result?.error as { message?: string } | undefined)?.message;
      if (errMsg) {
        return { status: 'error', message: messageForCode(errMsg), fieldErrors: {} };
      }
    }

    revalidatePath('/dashboard/redemption');

    return toActionState(formDataObject.id ? 'Canje actualizado correctamente.' : 'Canje creado correctamente.');
  } catch (error) {
    return fromErrorToActionState(error);
  }
}
