"use server";

import { createClient } from '@/lib/supabase/server';
import { Assignment } from '@/types/assignment';
import { AssignmentSchema } from '@/schemas/assignment.schema';

export async function createAssignment(input: Assignment) {
  const parsed = AssignmentSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('assignment').insert([parsed.data]).select().single();

  return { data, error };
}

export async function updateAssignment(id: string, input: Assignment) {
  const parsed = AssignmentSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('assignment').update(parsed.data).eq('id', id).select().single();

  return { data, error };
}

export async function deleteAssignment(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('assignment').delete().eq('id', id);

  return { error };
}
