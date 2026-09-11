'use server';

import { revalidatePath } from 'next/cache';

import { createAddress, updateAddress } from '@/actions/dashboard/address/actions';
import { cleanFormData, fromErrorToActionState, toActionState, type ActionState } from '@/lib/error-handler';
import { AddressSchema } from '@/schemas/address.schema';
import type { Address } from '@/types/address';


export async function addressFormAction(_prevState: ActionState, formData: FormData) {
  try {
    const formDataObject = cleanFormData(formData);
    const parsed = AddressSchema.safeParse(formDataObject);

    if (!parsed.success) {
      return await fromErrorToActionState(parsed.error);
    }

    // `create*`/`update*` NO tiran: devuelven { data, error }. Sin este
    // chequeo un INSERT fallado seguia de largo y el form contestaba "guardado
    // con exito". Se relanza para que el catch de abajo lo traduzca por `code`.
    const result = formDataObject.id
      ? await updateAddress(Number(formDataObject.id), parsed.data as Address)
      : await createAddress(parsed.data as Address);

    if (result.error) throw result.error;

    // Revalidate the address list page
    revalidatePath('/dashboard/address');

    return await toActionState(formDataObject.id ? 'addressUpdated' : 'addressCreated');
  } catch (error) {
    return await fromErrorToActionState(error);
  }
}