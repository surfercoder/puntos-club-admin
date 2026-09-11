"use server";

import { revalidatePath } from 'next/cache';

import { createAddress } from '@/actions/dashboard/address/actions';
import { createBranch, updateBranch } from '@/actions/dashboard/branch/actions';
import { cleanFormData, fromErrorToActionState, toActionState, type ActionState } from '@/lib/error-handler';
import { BranchSchema } from '@/schemas/branch.schema';
import { AddressSchema } from '@/schemas/address.schema';
import type { Branch } from '@/types/branch';
import type { Address } from '@/types/address';
import { AppError } from '@/lib/errors';

export async function branchWithAddressFormAction(_prevState: ActionState, formData: FormData) {
  try {
    const formDataObj = cleanFormData(formData);

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
      return await fromErrorToActionState(parsedAddress.error);
    }

    const addressResult = await createAddress(parsedAddress.data as Address);
    
    if (addressResult.error) {
      throw new AppError('address.createFailed');
    }

    if (!addressResult.data?.id) {
      throw new AppError('address.noId');
    }

    const branchFields = {
      name: formDataObj.name as string,
      phone: formDataObj.phone as string | null,
      active: formDataObj.active,
      address_id: String(addressResult.data.id),
    };

    const parsedBranch = BranchSchema.safeParse(branchFields);
    if (!parsedBranch.success) {
      return await fromErrorToActionState(parsedBranch.error);
    }

    const branchId = formDataObj.id ? String(formDataObj.id) : '';

    if (branchId) {
      // El error del update se miraba: sin esto, una edición que falla en la
      // base devolvía "guardado con éxito".
      const updateResult = await updateBranch(branchId, parsedBranch.data as Branch);

      if (updateResult.error) {
        throw new AppError('branch.updateFailed');
      }
    } else {
      const branchResult = await createBranch(parsedBranch.data as Branch);

      if (branchResult.error) {
        throw new AppError('branch.createFailed');
      }
    }

    revalidatePath('/dashboard/branch');
    revalidatePath('/dashboard/address');

    return await toActionState(formDataObj.id ? 'branchUpdated' : 'branchCreated');
  } catch (error) {
    return await fromErrorToActionState(error);
  }
}
