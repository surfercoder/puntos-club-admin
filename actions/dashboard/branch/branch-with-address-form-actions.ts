"use server";

import { revalidatePath } from 'next/cache';

import { createAddress } from '@/actions/dashboard/address/actions';
import { createBranch, updateBranch } from '@/actions/dashboard/branch/actions';
import { fromErrorToActionState, toActionState, type ActionState } from '@/lib/error-handler';
import { BranchSchema } from '@/schemas/branch.schema';
import { AddressSchema } from '@/schemas/address.schema';
import type { Branch } from '@/types/branch';
import type { Address } from '@/types/address';

export async function branchWithAddressFormAction(_prevState: ActionState, formData: FormData) {
  try {
    const formDataObj = Object.fromEntries(formData);

    const addressFields = {
      street: formDataObj.street as string,
      number: formDataObj.number as string,
      city: formDataObj.city as string,
      state: formDataObj.state as string,
      zip_code: formDataObj.zip_code as string,
      country: formDataObj.country as string | undefined,
      place_id: formDataObj.place_id as string | undefined,
      latitude: formDataObj.latitude ? Number(formDataObj.latitude) : undefined,
      longitude: formDataObj.longitude ? Number(formDataObj.longitude) : undefined,
    };

    const parsedAddress = AddressSchema.safeParse(addressFields);
    if (!parsedAddress.success) {
      return fromErrorToActionState(parsedAddress.error);
    }

    const addressResult = await createAddress(parsedAddress.data as Address);
    
    if (addressResult.error) {
      return {
        message: '',
        fieldErrors: {},
        formError: addressResult.error.message || 'Failed to create address',
      };
    }

    if (!addressResult.data?.id) {
      return {
        message: '',
        fieldErrors: {},
        formError: 'Failed to create address - no ID returned',
      };
    }

    const branchFields = {
      name: formDataObj.name as string,
      phone: formDataObj.phone as string | null,
      active: formDataObj.active,
      address_id: String(addressResult.data.id),
    };

    const parsedBranch = BranchSchema.safeParse(branchFields);
    if (!parsedBranch.success) {
      return fromErrorToActionState(parsedBranch.error);
    }

    if (formData.get('id')) {
      await updateBranch(formData.get('id') as string, parsedBranch.data as Branch);
    } else {
      const branchResult = await createBranch(parsedBranch.data as Branch);
      
      if (branchResult.error) {
        return {
          message: '',
          fieldErrors: {},
          formError: branchResult.error.message || 'Failed to create branch',
        };
      }
    }

    revalidatePath('/dashboard/branch');
    revalidatePath('/dashboard/address');

    return toActionState(formData.get('id') ? 'Branch updated successfully!' : 'Branch created successfully!');
  } catch (error) {
    return fromErrorToActionState(error);
  }
}
