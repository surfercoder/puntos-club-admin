'use server';

import { revalidatePath } from 'next/cache';

import { createCategory, updateCategory } from '@/actions/dashboard/category/actions';
import { fromErrorToActionState, toActionState, type ActionState } from '@/lib/error-handler';
import { CategorySchema } from '@/schemas/category.schema';
import type { Category } from '@/types/category';

export async function categoryFormAction(_prevState: ActionState, formData: FormData) {
  try {
    const parsed = CategorySchema.safeParse(Object.fromEntries(formData));

    if (!parsed.success) {
      return fromErrorToActionState(parsed.error);
    }

    if (formData.get('id')) {
      await updateCategory(String(formData.get('id')), parsed.data as Category);
    } else {
      await createCategory(parsed.data as Category);
    }

    // Revalidate the category list page
    revalidatePath('/dashboard/category');

    return toActionState(formData.get('id') ? 'Category updated successfully!' : 'Category created successfully!');
  } catch (error) {
    return fromErrorToActionState(error);
  }
}
