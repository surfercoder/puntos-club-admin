"use server";

import { createClient } from '@/lib/supabase/server';
import { Address } from '@/types/address';
import { AddressSchema } from '@/schemas/address.schema';

export async function createAddress(input: Address) {
  const parsed = AddressSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.errors.forEach(err => {
      if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('address').insert([parsed.data]).select().single();

  return { data, error };
}

export async function updateAddress(id: number, input: Address) {
  const parsed = AddressSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.errors.forEach(err => {
      if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('address').update(parsed.data).eq('id', id).select().single();

  return { data, error };
}

export async function deleteAddress(id: number) {
  const supabase = await createClient();
  const { error } = await supabase.from('address').delete().eq('id', id);

  return { error };
}
