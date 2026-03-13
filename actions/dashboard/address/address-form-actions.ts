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
      return fromErrorToActionState(parsed.error);
    }

    if (formDataObject.id) {
      await updateAddress(Number(formDataObject.id), parsed.data as Address);
    } else {
      await createAddress(parsed.data as Address);
    }

    // Revalidate the address list page
    revalidatePath('/dashboard/address');

    return toActionState(formDataObject.id ? 'Address updated successfully!' : 'Address created successfully!');
  } catch (error) {
    return fromErrorToActionState(error);
  }
}