'use server';

import { revalidatePath } from 'next/cache';

import { createAssignment, updateAssignment } from '@/actions/dashboard/assignment/actions';
import { fromErrorToActionState, toActionState, type ActionState } from '@/lib/error-handler';
import { AssignmentSchema } from '@/schemas/assignment.schema';
import type { Assignment } from '@/types/assignment';


export async function assignmentFormAction(_prevState: ActionState, formData: FormData) {
  try {
    const formObject = Object.fromEntries(formData);
    
    // Create a properly typed object for parsing
    const parsedObject: Record<string, unknown> = { ...formObject };
    
    // Convert points to number
    if (parsedObject.points && typeof parsedObject.points === 'string') {
      parsedObject.points = Number(parsedObject.points);
    }
    
    // Handle user_id: convert 'system' to null
    if (parsedObject.user_id === 'system') {
      parsedObject.user_id = null;
    }
    
    // Set assignment_date to current date if not provided
    if (!parsedObject.assignment_date) {
      parsedObject.assignment_date = new Date().toISOString();
    }

    const parsed = AssignmentSchema.safeParse(parsedObject);

    if (!parsed.success) {
      return fromErrorToActionState(parsed.error);
    }

    if (formData.get('id')) {
      await updateAssignment(String(formData.get('id')), parsed.data as Assignment);
    } else {
      await createAssignment(parsed.data as Assignment);
    }

    // Revalidate the assignment list page
    revalidatePath('/dashboard/assignment');

    return toActionState(formData.get('id') ? 'Assignment updated successfully!' : 'Assignment created successfully!');
  } catch (error) {
    return fromErrorToActionState(error);
  }
}
