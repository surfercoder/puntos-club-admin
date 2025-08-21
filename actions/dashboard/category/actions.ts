"use server";

import { createClient } from '@/lib/supabase/server';
import { CategorySchema } from '@/schemas/category.schema';
import type { Category } from '@/types/category';

export async function createCategory(input: Category) {
  const parsed = CategorySchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('category').insert([parsed.data]).select().single();

  return { data, error };
}

export async function updateCategory(id: string, input: Category) {
  const parsed = CategorySchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('category').update(parsed.data).eq('id', id).select().single();

  return { data, error };
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('category').delete().eq('id', id);

  return { error };
}

export async function getCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('category').select('*').order('name');

  return { data, error };
}

export async function getCategory(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('category').select('*').eq('id', id).single();

  return { data, error };
}
