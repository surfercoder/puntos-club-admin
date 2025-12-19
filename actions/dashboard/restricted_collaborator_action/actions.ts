"use server";

import { createClient } from '@/lib/supabase/server';
import { RestrictedCollaboratorActionSchema } from '@/schemas/restricted_collaborator_action.schema';
import type { RestrictedCollaboratorAction } from '@/schemas/restricted_collaborator_action.schema';

export async function createRestrictedCollaboratorAction(input: RestrictedCollaboratorAction) {
  const parsed = RestrictedCollaboratorActionSchema.safeParse(input);

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
    .from('restricted_collaborator_action')
    .insert([
      {
        action_name: parsed.data.action_name,
        description: parsed.data.description ?? null,
      },
    ])
    .select()
    .single();

  return { data, error };
}

export async function updateRestrictedCollaboratorAction(id: string, input: RestrictedCollaboratorAction) {
  const parsed = RestrictedCollaboratorActionSchema.safeParse(input);

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
    .from('restricted_collaborator_action')
    .update({
      action_name: parsed.data.action_name,
      description: parsed.data.description ?? null,
    })
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

export async function deleteRestrictedCollaboratorAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('restricted_collaborator_action').delete().eq('id', id);

  return { error };
}

export async function getRestrictedCollaboratorActions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('restricted_collaborator_action')
    .select('*')
    .order('action_name');

  return { data, error };
}

export async function getRestrictedCollaboratorAction(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('restricted_collaborator_action')
    .select('*')
    .eq('id', id)
    .single();

  return { data, error };
}
