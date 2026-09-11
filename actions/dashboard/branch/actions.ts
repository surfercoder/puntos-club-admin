"use server";

import { cookies } from 'next/headers';

import { requireUser } from '@/lib/auth/require-user';
import { createClient } from '@/lib/supabase/server';
import { BranchSchema } from '@/schemas/branch.schema';
import type { Branch } from '@/types/branch';
import { enforcePlanLimit } from '@/lib/plans/usage';
import { translateError } from '@/lib/error-handler';
import { AppError } from '@/lib/errors';

export async function createBranch(input: Branch) {
  await requireUser();
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
  const parsedOrgId = activeOrgId ? parseInt(activeOrgId, 10) : NaN;
  const activeOrgIdNumber = Number.isFinite(parsedOrgId) ? parsedOrgId : null;

  if (!activeOrgIdNumber) {
    return { data: null, error: new AppError('organization.noActive') };
  }

  const limitError = await enforcePlanLimit(activeOrgIdNumber, 'branches');
  if (limitError) {
    return { data: null, error: { message: await translateError(limitError) } };
  }

  const { data, error } = await supabase.from('branch').insert([{
    ...parsed.data,
    organization_id: activeOrgIdNumber,
  }]).select().single();

  return { data, error };
}

export async function updateBranch(id: string, input: Branch) {
  await requireUser();
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
  const parsedOrgId = activeOrgId ? parseInt(activeOrgId, 10) : NaN;
  const activeOrgIdNumber = Number.isFinite(parsedOrgId) ? parsedOrgId : null;

  if (!activeOrgIdNumber) {
    return { data: null, error: new AppError('organization.noActive') };
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
  await requireUser();
  const supabase = await createClient();
  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;
  const parsedOrgId = activeOrgId ? parseInt(activeOrgId, 10) : NaN;
  const activeOrgIdNumber = Number.isFinite(parsedOrgId) ? parsedOrgId : null;

  if (!activeOrgIdNumber) {
    return { error: new AppError('organization.noActive') };
  }

  const { error } = await supabase
    .from('branch')
    .delete()
    .eq('id', id)
    .eq('organization_id', activeOrgIdNumber);

  return { error: error ? { message: await translateError(error), code: error.code } : null };
}
