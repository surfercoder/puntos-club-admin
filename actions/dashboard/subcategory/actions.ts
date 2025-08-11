"use server";

import { createClient } from '@/lib/supabase/server';
import { Subcategory } from '@/types/subcategory';
import { SubcategorySchema } from '@/schemas/subcategory.schema';

export async function createSubcategory(input: Subcategory) {
  const parsed = SubcategorySchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('subcategory').insert([parsed.data]).select().single();

  return { data, error };
}

export async function updateSubcategory(id: string, input: Subcategory) {
  const parsed = SubcategorySchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('subcategory').update(parsed.data).eq('id', id).select().single();

  return { data, error };
}

export async function deleteSubcategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('subcategory').delete().eq('id', id);

  return { error };
}

export async function getSubcategories() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('subcategory').select('*').order('name');

  return { data, error };
}

export async function getSubcategory(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('subcategory').select('*').eq('id', id).single();

  return { data, error };
}