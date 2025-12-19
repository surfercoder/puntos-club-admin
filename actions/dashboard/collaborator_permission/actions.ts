"use server";

import { createClient } from '@/lib/supabase/server';
import { CollaboratorPermissionSchema } from '@/schemas/collaborator_permission.schema';
import type { CollaboratorPermission } from '@/schemas/collaborator_permission.schema';

export async function createCollaboratorPermission(input: CollaboratorPermission) {
  const parsed = CollaboratorPermissionSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((err) => {
      if (err.path[0]) {
        fieldErrors[err.path[0] as string] = err.message;
      }
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('collaborator_permission')
    .insert([
      {
        collaborator_id: parsed.data.collaborator_id,
        permission_type: parsed.data.permission_type,
        can_execute: parsed.data.can_execute ?? true,
      },
    ])
    .select()
    .single();

  return { data, error };
}

export async function updateCollaboratorPermission(id: string, input: CollaboratorPermission) {
  const parsed = CollaboratorPermissionSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((err) => {
      if (err.path[0]) {
        fieldErrors[err.path[0] as string] = err.message;
      }
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('collaborator_permission')
    .update({
      collaborator_id: parsed.data.collaborator_id,
      permission_type: parsed.data.permission_type,
      can_execute: parsed.data.can_execute ?? true,
    })
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

export async function deleteCollaboratorPermission(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('collaborator_permission').delete().eq('id', id);

  return { error };
}

export async function getCollaboratorPermissions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('collaborator_permission')
    .select(`
      *,
      collaborator:collaborator_id(id, first_name, last_name, email)
    `)
    .order('id', { ascending: false });

  return { data, error };
}

export async function getCollaboratorPermission(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('collaborator_permission')
    .select('*')
    .eq('id', id)
    .single();

  return { data, error };
}
