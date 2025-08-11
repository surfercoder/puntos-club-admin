"use server";

import { createClient } from '@/lib/supabase/server';
import { UserPermission } from '@/types/user_permission';
import { UserPermissionSchema } from '@/schemas/user_permission.schema';

export async function createUserPermission(input: UserPermission) {
  const parsed = UserPermissionSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('user_permission').insert([parsed.data]).select().single();

  return { data, error };
}

export async function updateUserPermission(id: string, input: UserPermission) {
  const parsed = UserPermissionSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('user_permission').update(parsed.data).eq('id', id).select().single();

  return { data, error };
}

export async function deleteUserPermission(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('user_permission').delete().eq('id', id);

  return { error };
}

export async function getUserPermissions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('user_permission')
    .select(`
      *,
      app_user:app_user(first_name, last_name, email),
      branch:branch(name)
    `)
    .order('assignment_date', { ascending: false });

  return { data, error };
}

export async function getUserPermission(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('user_permission').select('*').eq('id', id).single();

  return { data, error };
}