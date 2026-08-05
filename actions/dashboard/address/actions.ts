"use server";

import { getCurrentUser } from '@/lib/auth/get-current-user';
import { getMutationOrgId } from '@/lib/auth/get-mutation-org-id';
import { requireUser } from '@/lib/auth/require-user';
import { isAdmin } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/server';
import { AddressSchema } from '@/schemas/address.schema';
import type { Address } from '@/types/address';

export async function createAddress(input: Address) {
  await requireUser();

  const parsed = AddressSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  const [supabase, activeOrgIdNumber] = await Promise.all([createClient(), getMutationOrgId()]);

  if (!activeOrgIdNumber) {
    return { data: null, error: { message: 'Missing active organization' } };
  }

  const { data, error } = await supabase
    .from('address')
    .insert([
      {
        ...parsed.data,
        organization_id: activeOrgIdNumber,
      },
    ])
    .select()
    .single();

  return { data, error };
}

export async function updateAddress(id: number, input: Address) {
  await requireUser();

  const parsed = AddressSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  const [supabase, currentUser] = await Promise.all([createClient(), getCurrentUser()]);
  const userIsAdmin = isAdmin(currentUser);

  const activeOrgIdNumber = await getMutationOrgId();

  // Non-admin users require an active organization
  if (!userIsAdmin && (!activeOrgIdNumber || Number.isNaN(activeOrgIdNumber))) {
    return { data: null, error: { message: 'Missing active organization' } };
  }

  // For admins, fetch the existing address to preserve its organization_id
  // For non-admins, use the active organization
  let organizationId = activeOrgIdNumber;
  if (userIsAdmin) {
    const { data: existingAddress } = await supabase
      .from('address')
      .select('organization_id')
      .eq('id', id)
      .single();
    if (existingAddress) {
      organizationId = existingAddress.organization_id;
    }
  }

  let query = supabase
    .from('address')
    .update({
      ...parsed.data,
      organization_id: organizationId,
    })
    .eq('id', id);

  // Non-admin users can only update addresses in their organization
  if (!userIsAdmin && activeOrgIdNumber) {
    query = query.eq('organization_id', activeOrgIdNumber);
  }

  const { data, error } = await query.select().single();

  return { data, error };
}

export async function deleteAddress(id: number) {
  await requireUser();

  const [supabase, currentUser] = await Promise.all([createClient(), getCurrentUser()]);
  const userIsAdmin = isAdmin(currentUser);

  const activeOrgIdNumber = await getMutationOrgId();

  // Non-admin users require an active organization
  if (!userIsAdmin && (!activeOrgIdNumber || Number.isNaN(activeOrgIdNumber))) {
    return { error: { message: 'Missing active organization' } };
  }

  let query = supabase
    .from('address')
    .delete()
    .eq('id', id);

  // Non-admin users can only delete addresses in their organization
  if (!userIsAdmin && activeOrgIdNumber) {
    query = query.eq('organization_id', activeOrgIdNumber);
  }

  const { error } = await query;

  return { error };
}
