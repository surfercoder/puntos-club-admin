'use server';

import { revalidatePath } from 'next/cache';

import { createSubcategory, updateSubcategory } from '@/actions/dashboard/subcategory/actions';
import { fromErrorToActionState, toActionState, type ActionState } from '@/lib/error-handler';
import { SubcategorySchema } from '@/schemas/subcategory.schema';
import type { Subcategory } from '@/types/subcategory';

export async function subcategoryFormAction(_prevState: ActionState, formData: FormData) {
  try {
    const parsed = SubcategorySchema.safeParse(Object.fromEntries(formData));

    if (!parsed.success) {
      return fromErrorToActionState(parsed.error);
    }

    if (formData.get('id')) {
      await updateSubcategory(String(formData.get('id')), parsed.data as Subcategory);
    } else {
      await createSubcategory(parsed.data as Subcategory);
    }

    // Revalidate the subcategory list page
    revalidatePath('/dashboard/subcategory');

    return toActionState(formData.get('id') ? 'Subcategory updated successfully!' : 'Subcategory created successfully!');
  } catch (error) {
    return fromErrorToActionState(error);
  }
}