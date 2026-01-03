"use server";

import { cookies } from 'next/headers';

import { createClient } from '@/lib/supabase/server';
import { BranchSchema } from '@/schemas/branch.schema';
import type { Branch } from '@/types/branch';

export async function createBranch(input: Branch) {
  const parsed = BranchSchema.safeParse(input);

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
  const activeOrgIdNumber = activeOrgId ? Number(activeOrgId) : null;

  if (!activeOrgIdNumber || Number.isNaN(activeOrgIdNumber)) {
    return { data: null, error: { message: 'No active organization selected' } };
  }

  const { data, error } = await supabase.from('branch').insert([{
    ...parsed.data,
    organization_id: activeOrgIdNumber,
  }]).select().single();

  return { data, error };
}

export async function updateBranch(id: string, input: Branch) {
  const parsed = BranchSchema.safeParse(input);

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
  const activeOrgIdNumber = activeOrgId ? Number(activeOrgId) : null;

  if (!activeOrgIdNumber || Number.isNaN(activeOrgIdNumber)) {
    return { data: null, error: { message: 'No active organization selected' } };
  }

  const { data, error } = await supabase
    .from('branch')
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

export async function deleteBranch(id: string) {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;
  const activeOrgIdNumber = activeOrgId ? Number(activeOrgId) : null;

  if (!activeOrgIdNumber || Number.isNaN(activeOrgIdNumber)) {
    return { error: { message: 'No active organization selected' } };
  }

  const { error } = await supabase
    .from('branch')
    .delete()
    .eq('id', id)
    .eq('organization_id', activeOrgIdNumber);

  return { error };
}
