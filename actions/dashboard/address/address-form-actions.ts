'use server';

import { revalidatePath } from 'next/cache';

import { createAddress, updateAddress } from '@/actions/dashboard/address/actions';
import { fromErrorToActionState, toActionState } from '@/lib/error-handler';
import { AddressSchema } from '@/schemas/address.schema';
import type { Address } from '@/types/address';


export async function addressFormAction(_prevState: any, formData: FormData) {
  try {
    const parsed = AddressSchema.safeParse(Object.fromEntries(formData));

    if (!parsed.success) {
      return fromErrorToActionState(parsed.error);
    }

    if (formData.get('id')) {
      await updateAddress(Number(formData.get('id')), parsed.data as Address);
    } else {
      await createAddress(parsed.data as Address);
    }

    // Revalidate the address list page
    revalidatePath('/address');

    return toActionState(formData.get('id') ? 'Address updated successfully!' : 'Address created successfully!');
  } catch (error) {
    return fromErrorToActionState(error);
  }
}