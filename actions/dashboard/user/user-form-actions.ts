'use server';

import { revalidatePath } from 'next/cache';

import { createUser, updateUser } from '@/actions/dashboard/user/actions';
import { fromErrorToActionState, toActionState, type ActionState } from '@/lib/error-handler';
import { UserSchema } from '@/schemas/user.schema';
import type { User } from '@/types/user';

export async function userFormAction(_prevState: ActionState, formData: FormData) {
  try {
    const formDataObject = Object.fromEntries(formData);
    console.log('Form data received:', formDataObject);
    
    const parsed = UserSchema.safeParse(formDataObject);

    if (!parsed.success) {
      console.error('Validation failed:', parsed.error);
      return fromErrorToActionState(parsed.error);
    }

    console.log('Parsed data:', parsed.data);

    if (formData.get('id')) {
      const result = await updateUser(String(formData.get('id')), parsed.data as User);
      console.log('Update result:', result);
    } else {
      const result = await createUser(parsed.data as User);
      console.log('Create result:', result);
    }

    // Revalidate the user list page
    revalidatePath('/dashboard/users');

    return toActionState(formData.get('id') ? 'User updated successfully!' : 'User created successfully!');
  } catch (error) {
    console.error('Error in userFormAction:', error);
    return fromErrorToActionState(error);
  }
}
