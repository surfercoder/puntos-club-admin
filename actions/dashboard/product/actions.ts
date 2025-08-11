"use server";

import { createClient } from '@/lib/supabase/server';
import { Product } from '@/types/product';
import { ProductSchema } from '@/schemas/product.schema';

export async function createProduct(input: Product) {
  const parsed = ProductSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('product').insert([parsed.data]).select().single();

  return { data, error };
}

export async function updateProduct(id: string, input: Product) {
  const parsed = ProductSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('product').update(parsed.data).eq('id', id).select().single();

  return { data, error };
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('product').delete().eq('id', id);

  return { error };
}

export async function getProducts() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('product').select('*').order('name');

  return { data, error };
}

export async function getProduct(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('product').select('*').eq('id', id).single();

  return { data, error };
}