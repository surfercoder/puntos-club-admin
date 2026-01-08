"use server";

import { cookies } from 'next/headers';

import { createClient } from '@/lib/supabase/server';
import { AddressSchema } from '@/schemas/address.schema';
import type { Address } from '@/types/address';

export async function createAddress(input: Address) {
  const parsed = AddressSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;
  const parsedOrgId = activeOrgId ? parseInt(activeOrgId, 10) : NaN;
  const activeOrgIdNumber = Number.isFinite(parsedOrgId) ? parsedOrgId : null;

  if (!activeOrgIdNumber || Number.isNaN(activeOrgIdNumber)) {
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
  const parsed = AddressSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;
  const parsedOrgId = activeOrgId ? parseInt(activeOrgId, 10) : NaN;
  const activeOrgIdNumber = Number.isFinite(parsedOrgId) ? parsedOrgId : null;

  if (!activeOrgIdNumber || Number.isNaN(activeOrgIdNumber)) {
    return { data: null, error: { message: 'Missing active organization' } };
  }

  const { data, error } = await supabase
    .from('address')
    .update({
      ...parsed.data,
      organization_id: activeOrgIdNumber,
    })
    .eq('id', id)
    .eq('organization_id', activeOrgIdNumber)
    .select()
    .single();

  return { data, error };
}

export async function deleteAddress(id: number) {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;
  const parsedOrgId = activeOrgId ? parseInt(activeOrgId, 10) : NaN;
  const activeOrgIdNumber = Number.isFinite(parsedOrgId) ? parsedOrgId : null;

  if (!activeOrgIdNumber || Number.isNaN(activeOrgIdNumber)) {
    return { error: { message: 'Missing active organization' } };
  }

  const { error } = await supabase
    .from('address')
    .delete()
    .eq('id', id)
    .eq('organization_id', activeOrgIdNumber);

  return { error };
}
