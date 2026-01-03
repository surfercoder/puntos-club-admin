'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createCategory, updateCategory } from '@/actions/dashboard/category/actions';
import { fromErrorToActionState, type ActionState } from '@/lib/error-handler';
import { CategorySchema } from '@/schemas/category.schema';
import type { Category } from '@/types/category';

export async function categoryFormAction(_prevState: ActionState, formData: FormData) {
  const parsed = CategorySchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return fromErrorToActionState(parsed.error);
  }

  const isUpdate = !!formData.get('id');
  const result = isUpdate
    ? await updateCategory(String(formData.get('id')), parsed.data as Category)
    : await createCategory(parsed.data as Category);

  if (result.error) {
    return fromErrorToActionState(result.error);
  }

  // Revalidate the category list page
  revalidatePath('/dashboard/category');
  
  // Redirect with success message
  const message = isUpdate ? 'Category updated successfully!' : 'Category created successfully!';
  redirect(`/dashboard/category?success=${encodeURIComponent(message)}`);
}
